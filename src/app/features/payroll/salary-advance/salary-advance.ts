import {
  ChangeDetectionStrategy, Component, DestroyRef,
  computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpErrorResponse } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { BatchService, BatchSaveEntry, BatchSavePayload, PivotRow } from '../batch/batch.service';
import { SalaryAdvanceService, SalAdvEntry } from './salary-advance.service';
import { ExportButtonComponent } from '../../import-export/export-button/export-button.component';

// ── Types ─────────────────────────────────────────────────────────────────

interface SalAdvFlatRow {
  empId:       number;
  employeeNo:  string;
  payrollName: string;
  amount:      number;
  isProcessed: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-salary-advance',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, ReactiveFormsModule,
    MatButtonModule, MatFormFieldModule,
    MatIconModule, MatInputModule,
    MatProgressSpinnerModule, MatSelectModule, MatTooltipModule,
    ExportButtonComponent,
  ],
  templateUrl: './salary-advance.html',
  styleUrl:    './salary-advance.scss',
})
export class SalaryAdvance {
  private readonly fb          = inject(FormBuilder);
  private readonly batchSvc    = inject(BatchService);
  private readonly salAdvSvc   = inject(SalaryAdvanceService);
  private readonly destroyRef  = inject(DestroyRef);

  // ── Period form ────────────────────────────────────────────────────────
  private readonly _today = new Date();

  readonly months = [
    { value:  1, label: 'January'   }, { value:  2, label: 'February'  },
    { value:  3, label: 'March'     }, { value:  4, label: 'April'     },
    { value:  5, label: 'May'       }, { value:  6, label: 'June'      },
    { value:  7, label: 'July'      }, { value:  8, label: 'August'    },
    { value:  9, label: 'September' }, { value: 10, label: 'October'   },
    { value: 11, label: 'November'  }, { value: 12, label: 'December'  },
  ];

  readonly years = [
    this._today.getFullYear() - 1,
    this._today.getFullYear(),
    this._today.getFullYear() + 1,
  ];

  readonly periodForm = this.fb.group({
    month: this.fb.nonNullable.control(this._today.getMonth() + 1, [Validators.required, Validators.min(1)]),
    year:  this.fb.nonNullable.control(this._today.getFullYear(), Validators.required),
  });

  get periodLabel(): string {
    const { month, year } = this.periodForm.getRawValue();
    return `${this.months.find(x => x.value === month)?.label ?? ''} ${year}`;
  }

  get payrollMonthStr(): string {
    const { month, year } = this.periodForm.getRawValue();
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  // ── Entry view state ───────────────────────────────────────────────────
  readonly loading      = signal(false);
  readonly saving       = signal(false);
  readonly saveError    = signal<string | null>(null);
  readonly saveSuccess  = signal(false);

  // ── Salary Advance table state ─────────────────────────────────────────
  private readonly _rows           = signal<SalAdvFlatRow[]>([]);
  readonly salAdvFilter            = signal('');
  readonly salAdvEditCtrl          = this.fb.nonNullable.control(0);
  private readonly _salAdvEditCell = signal<number | null>(null);

  readonly filteredSalAdvRows = computed(() => {
    const f = this.salAdvFilter().toLowerCase().trim();
    return this._rows()
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) =>
        !f ||
        row.payrollName.toLowerCase().includes(f) ||
        row.employeeNo.toLowerCase().includes(f),
      );
  });

  readonly salAdvRowsCount   = computed(() => this._rows().length);
  readonly salAdvAmountTotal = computed(() => this._rows().reduce((s, r) => s + r.amount, 0));

  // ── Draft view state ───────────────────────────────────────────────────
  readonly showDraft     = signal(false);
  readonly draftReadOnly = signal(false);
  readonly draftLoading  = signal(false);
  readonly draftEntries  = signal<SalAdvEntry[]>([]);
  readonly lockingId     = signal<number | null>(null);
  readonly lockingAll    = signal(false);
  readonly lockError     = signal<string | null>(null);

  readonly draftDraftCount  = computed(() => this.draftEntries().filter(e => e.status === 'DRAFT').length);
  readonly draftLockedCount = computed(() => this.draftEntries().filter(e => e.status === 'LOCKED').length);
  readonly draftTotal       = computed(() => this.draftEntries().reduce((s, e) => s + e.amount, 0));

  // ── Lifecycle ──────────────────────────────────────────────────────────
  constructor() { this._load(); }

  // ── Period change ──────────────────────────────────────────────────────
  onPeriodChange(): void {
    this._rows.set([]);
    this.salAdvFilter.set('');
    this._salAdvEditCell.set(null);
    this.saveSuccess.set(false);
    this.saveError.set(null);
    this._load();
  }

  // ── SA inline edit ─────────────────────────────────────────────────────
  isSalAdvEditing(idx: number): boolean { return this._salAdvEditCell() === idx; }

  startSalAdvEdit(idx: number): void {
    const row = this._rows()[idx];
    if (!row || row.isProcessed) return;
    this.salAdvEditCtrl.setValue(row.amount);
    this._salAdvEditCell.set(idx);
  }

  saveSalAdvEdit(): void {
    const idx = this._salAdvEditCell();
    if (idx === null) return;
    const value = this.salAdvEditCtrl.value;
    this._rows.update(rows => {
      const updated = [...rows];
      updated[idx] = { ...updated[idx], amount: isNaN(value) ? 0 : value };
      return updated;
    });
    this._salAdvEditCell.set(null);
  }

  cancelSalAdvEdit(): void { this._salAdvEditCell.set(null); }

  // ── Draft view navigation ──────────────────────────────────────────────
  backToEntry(): void {
    this.showDraft.set(false);
    this.saveSuccess.set(false);
    this.lockError.set(null);
  }

  viewDraft(): void {
    if (this.draftLoading() || this.periodForm.invalid) return;
    const { month, year } = this.periodForm.getRawValue();
    this.draftLoading.set(true);
    this.saveError.set(null);
    this.salAdvSvc.getByPeriod(month, year)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: entries => {
          this.draftLoading.set(false);
          this.draftEntries.set(entries);
          this.draftReadOnly.set(true);
          this.showDraft.set(true);
        },
        error: (err: unknown) => {
          this.draftLoading.set(false);
          this.saveError.set(this._extractError(err, 'Failed to load draft.'));
        },
      });
  }

  // ── Save ───────────────────────────────────────────────────────────────
  save(): void {
    if (this.saving() || this.periodForm.invalid) return;
    this.saveSalAdvEdit();
    this.saving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(false);

    const { month, year } = this.periodForm.getRawValue();
    const modifiedBy = 1; // TODO: replace with AuthService user id

    this.batchSvc
      .save({ periodMonth: month, periodYear: year, entries: this._buildEntries() } satisfies BatchSavePayload, modifiedBy)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  ()             => { this.saving.set(false); this.saveSuccess.set(true); },
        error: (err: unknown) => {
          this.saving.set(false);
          this.saveError.set(this._extractError(err, 'Save failed. Please try again.'));
        },
      });
  }

  saveAndLock(): void {
    if (this.saving() || this.periodForm.invalid) return;
    this.saveSalAdvEdit();
    this.saving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(false);

    const { month, year } = this.periodForm.getRawValue();
    const modifiedBy = 1; // TODO: replace with AuthService user id

    this.batchSvc
      .save({ periodMonth: month, periodYear: year, entries: this._buildEntries() } satisfies BatchSavePayload, modifiedBy)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this._lockAllAndShowDraft(month, year, modifiedBy);
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.saveError.set(this._extractError(err, 'Save failed. Please try again.'));
        },
      });
  }

  // ── Draft-view lock actions ────────────────────────────────────────────
  async lockEntry(entryId: number): Promise<void> {
    this.lockingId.set(entryId);
    this.lockError.set(null);
    try {
      const updated = await lastValueFrom(this.salAdvSvc.lockEntry(entryId, 1));
      this.draftEntries.update(entries =>
        entries.map(e => e.id === entryId ? updated : e),
      );
    } catch {
      this.lockError.set('Lock failed. Please try again.');
    } finally {
      this.lockingId.set(null);
    }
  }

  async lockAll(): Promise<void> {
    if (this.lockingAll()) return;
    const { month, year } = this.periodForm.getRawValue();
    this.lockingAll.set(true);
    this.lockError.set(null);
    try {
      await lastValueFrom(this.salAdvSvc.lockAll(month, year, 1));
      await this._refreshDraftEntries(month, year);
    } catch {
      this.lockError.set('Lock failed. Please try again.');
    } finally {
      this.lockingAll.set(false);
    }
  }

  // ── Private ────────────────────────────────────────────────────────────
  private _buildEntries(): BatchSaveEntry[] {
    return this._rows()
      .filter(r => !r.isProcessed && r.empId > 0)
      .map(r => ({
        componentCode: 'SAL_ADV',
        componentType: 'SAL_ADV',
        employeeId:    r.empId,
        amount:        r.amount,
      }));
  }

  private _lockAllAndShowDraft(month: number, year: number, lockedBy: number): void {
    this.salAdvSvc.lockAll(month, year, lockedBy)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.salAdvSvc.getByPeriod(month, year)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: entries => {
                this.draftEntries.set(entries);
                this.draftReadOnly.set(false);
                this.showDraft.set(true);
              },
              error: (err: unknown) => {
                this.saveError.set(this._extractError(err, 'Failed to load draft after lock.'));
              },
            });
        },
        error: (err: unknown) => {
          this.saveError.set(this._extractError(err, 'Lock failed. Please try again.'));
        },
      });
  }

  private async _refreshDraftEntries(month: number, year: number): Promise<void> {
    const entries = await lastValueFrom(this.salAdvSvc.getByPeriod(month, year));
    this.draftEntries.set(entries);
  }

  private _load(): void {
    const { month, year } = this.periodForm.getRawValue();
    this.loading.set(true);
    this.batchSvc.load(month, year)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: resp => {
          this.loading.set(false);
          this._rows.set(this._parseSalAdvRows(resp.salaryAdvances ?? []));
        },
        error: () => this.loading.set(false),
      });
  }

  private _parseSalAdvRows(rows: PivotRow[]): SalAdvFlatRow[] {
    return rows
      .filter(row => Number(row['id'] ?? row['ID']) > 0)
      .map(raw => {
        const row = this._normalise(raw);
        return {
          empId:       Number(row['id']),
          employeeNo:  String(row['employee_no'] ?? ''),
          payrollName: String(row['payroll_name'] || `${row['first_name'] ?? ''} ${row['last_name'] ?? ''}`.trim()),
          amount:      Number(row['sal_adv_amount'] ?? 0),
          isProcessed: String(row['is_processed']) === 'Y',
        };
      });
  }

  private _normalise(row: PivotRow): PivotRow {
    return Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]));
  }

  private _extractError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.error?.error ?? err.message ?? fallback;
    }
    if (err instanceof Error) return err.message;
    return fallback;
  }
}
