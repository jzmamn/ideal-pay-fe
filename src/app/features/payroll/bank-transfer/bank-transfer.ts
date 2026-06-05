import { DecimalPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component,
  DestroyRef, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { forkJoin } from 'rxjs';
import { BankService } from '../../infrastructure/banks/bank.service';
import { Bank } from '../../../shared/models/master-data.models';
import {
  BankGroup, BankTransferRow, BankTransferTemplate,
  TRANSFER_TYPE_LABELS, TransferType,
} from './bank-transfer.model';
import { BankTransferService } from './bank-transfer.service';
import {
  BankTemplateDialog,
  BankTemplateDialogData,
  BankTemplateDialogResult,
} from './bank-template-dialog/bank-template-dialog';

export type TransferMode = 'by-bank' | 'single-bank';

// ── File generation ──────────────────────────────────────────────────────────

function renderTemplate(tmpl: string, vars: Record<string, string>): string {
  return tmpl.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? '');
}

function generateBankFile(group: BankGroup): string {
  if (!group.template) return '';

  const today    = new Date().toISOString().slice(0, 10);
  const total    = group.rows.reduce((s, r) => s + r.totalAmount, 0);
  const count    = group.rows.length;
  const bankCode = group.bankCode ?? '';
  const bankName = group.bankName;

  const headerVars: Record<string, string> = {
    date: today, bank_name: bankName, bank_code: bankCode,
    record_count: String(count), total_amount: total.toFixed(2),
  };

  const lines: string[] = [];

  if (group.template.headerTemplate?.trim()) {
    lines.push(renderTemplate(group.template.headerTemplate, headerVars));
  }

  for (const row of group.rows) {
    const detailVars: Record<string, string> = {
      employee_no: row.employeeNo,
      name:        row.empName,
      account_no:  row.accountNo  ?? '',
      bank_code:   row.bankCode   ?? bankCode,
      branch_code: row.branchCode ?? '',
      amount:      row.totalAmount.toFixed(2),
      date:        today,
    };
    lines.push(renderTemplate(group.template.detailTemplate, detailVars));
  }

  if (group.template.footerTemplate?.trim()) {
    const footerVars: Record<string, string> = {
      record_count: String(count), total_amount: total.toFixed(2), date: today,
    };
    lines.push(renderTemplate(group.template.footerTemplate, footerVars));
  }

  return lines.join('\n');
}

function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

const MONTHS = [
  { value:  1, label: 'January'   }, { value:  2, label: 'February'  },
  { value:  3, label: 'March'     }, { value:  4, label: 'April'     },
  { value:  5, label: 'May'       }, { value:  6, label: 'June'      },
  { value:  7, label: 'July'      }, { value:  8, label: 'August'    },
  { value:  9, label: 'September' }, { value: 10, label: 'October'   },
  { value: 11, label: 'November'  }, { value: 12, label: 'December'  },
];

const TRANSFER_TYPES: { value: TransferType; label: string }[] = [
  { value: 'SALARY',          label: TRANSFER_TYPE_LABELS.SALARY          },
  { value: 'SALARY_ADVANCE',  label: TRANSFER_TYPE_LABELS.SALARY_ADVANCE  },
  { value: 'FIXED_ALLOWANCE', label: TRANSFER_TYPE_LABELS.FIXED_ALLOWANCE },
];

@Component({
  selector: 'app-bank-transfer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatTableModule,
    MatChipsModule,

    MatProgressSpinnerModule,
    MatExpansionModule,
    MatTooltipModule,
    MatBadgeModule,
    DecimalPipe, DatePipe,
    MatCheckboxModule,
  ],
  templateUrl: './bank-transfer.html',
  styleUrl:    './bank-transfer.scss',
})
export class BankTransfer {
  private readonly fb         = inject(FormBuilder);
  private readonly svc        = inject(BankTransferService);
  private readonly bankSvc    = inject(BankService);
  private readonly dialog     = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  // ── Reference data ────────────────────────────────────────────────────────

  readonly banks      = signal<Bank[]>([]);
  readonly templates  = signal<BankTransferTemplate[]>([]);
  readonly refLoading = signal(false);

  // ── Period + type + mode form ─────────────────────────────────────────────

  private readonly _today = new Date();

  readonly MONTHS         = MONTHS;
  readonly TRANSFER_TYPES = TRANSFER_TYPES;

  readonly years = [
    this._today.getFullYear() - 1,
    this._today.getFullYear(),
    this._today.getFullYear() + 1,
  ];

  readonly periodForm = this.fb.group({
    month: this.fb.nonNullable.control(this._today.getMonth() + 1, [Validators.required, Validators.min(1)]),
    year:  this.fb.nonNullable.control(this._today.getFullYear(), Validators.required),
  });

  readonly selectedType = signal<TransferType>('SALARY');

  /** Transfer mode: group by each employee's bank, or use one selected bank for all. */
  readonly mode = signal<TransferMode>('by-bank');

  /** Bank selected in single-bank mode. */
  readonly singleBankId = signal<number | null>(null);

  readonly singleBank = computed(() =>
    this.banks().find(b => b.id === this.singleBankId()) ?? null
  );

  readonly singleBankTemplate = computed(() => {
    const bank = this.singleBank();
    if (!bank) return null;
    return this.templates().find(t => t.bankCode === bank.code) ?? null;
  });

  /** A virtual BankGroup covering all rows, using the selected bank's template. */
  readonly singleBankGroup = computed<BankGroup | null>(() => {
    if (this.mode() !== 'single-bank') return null;
    const bank = this.singleBank();
    if (!bank) return null;
    const rows = this.rows();
    return {
      bankId:        bank.id,
      bankCode:      bank.code,
      bankName:      bank.name,
      template:      this.singleBankTemplate(),
      rows,
      total:         rows.reduce((s, r) => s + r.totalAmount, 0),
      fileGenerated: false,
    };
  });

  // ── Transfer state ────────────────────────────────────────────────────────

  readonly loading    = signal(false);
  readonly loadError  = signal<string | null>(null);
  readonly rows       = signal<BankTransferRow[]>([]);
  readonly markingIds = signal<Set<number>>(new Set<number>());
  readonly markError  = signal<string | null>(null);

  /** Rows grouped by each employee's own bank (by-bank mode). */
  readonly bankGroups = computed<BankGroup[]>(() => {
    const allRows = this.rows();
    const tmpls   = this.templates();
    const map     = new Map<string, BankGroup>();

    for (const row of allRows) {
      const key      = row.bankCode ?? '__NONE__';
      const existing = map.get(key);

      if (existing) {
        existing.rows.push(row);
        existing.total += row.totalAmount;
      } else {
        map.set(key, {
          bankId:        row.bankId,
          bankCode:      row.bankCode,
          bankName:      row.bankName ?? 'Unknown Bank',
          template:      tmpls.find(t => t.bankCode === row.bankCode) ?? null,
          rows:          [row],
          total:         row.totalAmount,
          fileGenerated: false,
        });
      }
    }
    return Array.from(map.values());
  });

  readonly pendingCount     = computed(() => this.rows().filter(r => r.transferStatus === 'PENDING').length);
  readonly transferredCount = computed(() => this.rows().filter(r => r.transferStatus === 'TRANSFERRED').length);
  readonly grandTotal       = computed(() => this.rows().reduce((s, r) => s + r.totalAmount, 0));
  readonly hasRows          = computed(() => this.rows().length > 0);

  // ── Row selection ─────────────────────────────────────────────────────────

  readonly selectedIds = signal<Set<number>>(new Set<number>());

  readonly selectedPendingCount = computed(() =>
    this.rows().filter(r => this.selectedIds().has(r.runId) && r.transferStatus === 'PENDING').length
  );

  isSelected(runId: number): boolean { return this.selectedIds().has(runId); }

  toggleRow(runId: number): void {
    this.selectedIds.update(s => {
      const n = new Set(s);
      n.has(runId) ? n.delete(runId) : n.add(runId);
      return n;
    });
  }

  isGroupAllSelected(group: BankGroup): boolean {
    return group.rows.length > 0 && group.rows.every(r => this.selectedIds().has(r.runId));
  }

  isGroupIndeterminate(group: BankGroup): boolean {
    const count = group.rows.filter(r => this.selectedIds().has(r.runId)).length;
    return count > 0 && count < group.rows.length;
  }

  toggleGroup(group: BankGroup): void {
    const allSelected = this.isGroupAllSelected(group);
    this.selectedIds.update(s => {
      const n = new Set(s);
      group.rows.forEach(r => allSelected ? n.delete(r.runId) : n.add(r.runId));
      return n;
    });
  }

  isAllSelected(): boolean {
    const rows = this.rows();
    return rows.length > 0 && rows.every(r => this.selectedIds().has(r.runId));
  }

  isAnyIndeterminate(): boolean {
    const count = this.rows().filter(r => this.selectedIds().has(r.runId)).length;
    return count > 0 && count < this.rows().length;
  }

  toggleAll(): void {
    const allSelected = this.isAllSelected();
    this.selectedIds.update(() =>
      allSelected ? new Set<number>() : new Set(this.rows().map(r => r.runId))
    );
  }

  markSelectedTransferred(): void {
    const ids = this.rows()
      .filter(r => this.selectedIds().has(r.runId) && r.transferStatus === 'PENDING')
      .map(r => r.runId);
    if (ids.length) this._markTransferred(ids);
  }

  effectiveGroupRows(group: BankGroup): BankTransferRow[] {
    const sel = this.selectedIds();
    const groupSelected = group.rows.filter(r => sel.has(r.runId));
    return groupSelected.length > 0 ? groupSelected : group.rows;
  }

  readonly displayedColumns = ['select', 'employeeNo', 'empName', 'accountNo', 'branchCode', 'totalAmount', 'status'];

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  constructor() { this._loadRef(); }

  // ── Helpers ───────────────────────────────────────────────────────────────

  get periodLabel(): string {
    const { month, year } = this.periodForm.getRawValue();
    return `${MONTHS.find(m => m.value === month)?.label ?? ''} ${year}`;
  }

  setMode(m: TransferMode): void {
    this.mode.set(m);
    this.singleBankId.set(null);
  }

  // ── Reference data load ───────────────────────────────────────────────────

  private _loadRef(): void {
    this.refLoading.set(true);
    forkJoin({ banks: this.bankSvc.getAll(), templates: this.svc.getTemplates() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ banks, templates }) => {
          this.banks.set(banks);
          this.templates.set(templates);
          this.refLoading.set(false);
        },
        error: () => this.refLoading.set(false),
      });
  }

  // ── Load transfer rows ────────────────────────────────────────────────────

  load(): void {
    if (this.loading() || this.periodForm.invalid) return;
    this.loading.set(true);
    this.loadError.set(null);
    this.markError.set(null);

    const { month, year } = this.periodForm.getRawValue();
    const mm           = String(month).padStart(2, '0');
    const payrollMonth = `${year}-${mm}`;

    this.svc.getTransferRows(payrollMonth, [this.selectedType()])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  data  => { this.rows.set(data); this.selectedIds.set(new Set()); this.loading.set(false); },
        error: ()    => {
          this.loadError.set('Failed to load transfer data. Please try again.');
          this.loading.set(false);
        },
      });
  }

  // ── File generation ───────────────────────────────────────────────────────

  generateFile(group: BankGroup): void {
    if (!group.template) return;
    const effectiveRows = this.effectiveGroupRows(group);
    const effectiveGroup: BankGroup = { ...group, rows: effectiveRows, total: effectiveRows.reduce((s, r) => s + r.totalAmount, 0) };
    const content = generateBankFile(effectiveGroup);
    const { month, year } = this.periodForm.getRawValue();
    const mm  = String(month).padStart(2, '0');
    const ext = group.template.fileExtension || 'txt';
    downloadFile(content, `transfer_${group.bankCode ?? 'ALL'}_${year}${mm}.${ext}`);
  }

  // ── Mark transferred ──────────────────────────────────────────────────────

  markGroupTransferred(group: BankGroup): void {
    const ids = group.rows.filter(r => r.transferStatus === 'PENDING').map(r => r.runId);
    if (ids.length) this._markTransferred(ids);
  }

  markAllTransferred(): void {
    const ids = this.rows().filter(r => r.transferStatus === 'PENDING').map(r => r.runId);
    if (ids.length) this._markTransferred(ids);
  }

  private _markTransferred(runIds: number[]): void {
    this.markingIds.update(s => new Set([...s, ...runIds]));
    this.markError.set(null);

    this.svc.markTransferred(runIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const now = new Date().toISOString();
          this.rows.update(list =>
            list.map(r => runIds.includes(r.runId)
              ? { ...r, transferStatus: 'TRANSFERRED' as const, transferredAt: now }
              : r
            )
          );
          this.markingIds.update(s => { const n = new Set(s); runIds.forEach(id => n.delete(id)); return n; });
        },
        error: () => {
          this.markError.set('Failed to mark as transferred. Please try again.');
          this.markingIds.update(s => { const n = new Set(s); runIds.forEach(id => n.delete(id)); return n; });
        },
      });
  }

  isMarking(runId: number): boolean { return this.markingIds().has(runId); }

  groupPendingCount(group: BankGroup): number {
    return group.rows.filter(r => r.transferStatus === 'PENDING').length;
  }

  // ── Template dialog ───────────────────────────────────────────────────────

  openTemplateManager(): void {
    this.dialog
      .open<BankTemplateDialog, BankTemplateDialogData, BankTemplateDialogResult>(BankTemplateDialog, {
        width: '860px', maxHeight: '90vh',
        data: { banks: this.banks(), templates: this.templates() },
      })
      .afterClosed()
      .subscribe(result => { if (result) this.templates.set(result.templates); });
  }
}
