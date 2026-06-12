import { DecimalPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component,
  DestroyRef, ViewChild, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TableAutocomplete, type TableColumn } from '../../../shared/components/table-autocomplete/table-autocomplete';
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
import { JobCategoryService } from '../../infrastructure/job-categories/job-category.service';
import { BranchService } from '../../infrastructure/branches/branch.service';
import { Bank, JobCategory, Branch } from '../../../shared/models/master-data.models';
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
  { value: 'BONUS',           label: TRANSFER_TYPE_LABELS.BONUS           },
];

@Component({
  selector: 'app-bank-transfer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
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
    TableAutocomplete,
  ],
  templateUrl: './bank-transfer.html',
  styleUrl:    './bank-transfer.scss',
})
export class BankTransfer {
  private readonly fb             = inject(FormBuilder);
  private readonly svc            = inject(BankTransferService);
  private readonly bankSvc        = inject(BankService);
  private readonly jobCategorySvc = inject(JobCategoryService);
  private readonly branchSvc      = inject(BranchService);
  private readonly dialog         = inject(MatDialog);
  private readonly destroyRef     = inject(DestroyRef);

  // ── Reference data ────────────────────────────────────────────────────────

  readonly banks         = signal<Bank[]>([]);
  readonly templates     = signal<BankTransferTemplate[]>([]);
  readonly jobCategories = signal<JobCategory[]>([]);
  readonly branches      = signal<Branch[]>([]);
  readonly refLoading    = signal(false);

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

  /** Selected template for file generation. */
  readonly selectedTemplateId = signal<number | null>(null);

  // ── Filters ───────────────────────────────────────────────────────────────

  @ViewChild('empAc') private readonly _empAc?: TableAutocomplete;

  readonly filterType          = signal<'employee' | 'jobCategory' | 'branch' | null>(null);
  readonly filterEmpId         = signal<number | null>(null);
  readonly filterJobCategoryId = signal<number | null>(null);
  readonly filterBranchId      = signal<number | null>(null);

  setFilterType(type: 'employee' | 'jobCategory' | 'branch' | null): void {
    this.filterType.set(type);
    this.filterEmpId.set(null);
    this.filterJobCategoryId.set(null);
    this.filterBranchId.set(null);
    this._empAc?.writeValue(null);
  }

  readonly employeeItems = computed(() => {
    const seen = new Set<number>();
    return this.rows().filter(r => {
      if (seen.has(r.empId)) return false;
      seen.add(r.empId);
      return true;
    }).map(r => ({ id: r.empId, employeeNo: r.employeeNo, name: r.empName }));
  });

  readonly employeeCols: TableColumn<{ id: number; employeeNo: string; name: string }>[] = [
    { key: 'employeeNo', label: 'Emp #' },
    { key: 'name',       label: 'Name'  },
  ];

  readonly empDisplayFn = (e: { id: number; employeeNo: string; name: string }) =>
    `${e.name} — ${e.employeeNo}`;

  onEmployeeSelected(item: unknown): void {
    this.filterEmpId.set((item as { id: number }).id);
  }

  clearEmployeeFilter(): void {
    this.filterEmpId.set(null);
    this._empAc?.writeValue(null);
  }

  onJobCategorySelected(id: number | null): void {
    this.filterJobCategoryId.set(id);
  }

  onBranchSelected(id: number | null): void {
    this.filterBranchId.set(id);
  }

  // ── Transfer state ────────────────────────────────────────────────────────

  readonly loading    = signal(false);
  readonly loadError  = signal<string | null>(null);
  readonly rows       = signal<BankTransferRow[]>([]);
  readonly markingIds = signal<Set<number>>(new Set<number>());
  readonly markError  = signal<string | null>(null);

  readonly filteredRows = computed(() => {
    const empId    = this.filterEmpId();
    const jcId     = this.filterJobCategoryId();
    const branchId = this.filterBranchId();
    return this.rows().filter(r => {
      if (empId    !== null && r.empId         !== empId)    return false;
      if (jcId     !== null && r.jobCategoryId !== jcId)     return false;
      if (branchId !== null && r.branchId      !== branchId) return false;
      return true;
    });
  });

  /** Rows grouped by each employee's own bank. */
  readonly bankGroups = computed<BankGroup[]>(() => {
    const allRows      = this.filteredRows();
    const tmpls        = this.templates();
    const selectedId   = this.selectedTemplateId();
    const selectedTmpl = selectedId !== null ? (tmpls.find(t => t.id === selectedId) ?? null) : null;
    const map          = new Map<string, BankGroup>();

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
          template:      selectedTmpl ?? tmpls.find(t => t.bankCode === row.bankCode) ?? null,
          rows:          [row],
          total:         row.totalAmount,
          fileGenerated: false,
        });
      }
    }
    return Array.from(map.values());
  });

  readonly pendingCount     = computed(() => this.filteredRows().filter(r => r.transferStatus === 'PENDING').length);
  readonly transferredCount = computed(() => this.filteredRows().filter(r => r.transferStatus === 'TRANSFERRED').length);
  readonly grandTotal       = computed(() => this.filteredRows().reduce((s, r) => s + r.totalAmount, 0));
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

  // ── Reference data load ───────────────────────────────────────────────────

  private _loadRef(): void {
    this.refLoading.set(true);
    forkJoin({
      banks:         this.bankSvc.getAll(),
      templates:     this.svc.getTemplates(),
      jobCategories: this.jobCategorySvc.getAll(),
      branches:      this.branchSvc.getAll(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ banks, templates, jobCategories, branches }) => {
          this.banks.set(banks);
          this.templates.set(templates);
          this.jobCategories.set(jobCategories);
          this.branches.set(branches);
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
