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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { HttpErrorResponse } from '@angular/common/http';
import { BatchService, BatchSaveEntry, BatchSavePayload, PivotRow } from '../batch/batch.service';
import { PivotComponent, PivotAmountChange, PivotRow as PivotViewRow } from '../../../shared/components/pivot/pivot';

// ── Types ──────────────────────────────────────────────────────────────────

interface BonusEmployee { id: number; code: string; name: string; }

// ── Component ──────────────────────────────────────────────────────────────

@Component({
  selector: 'app-bonus-batch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, ReactiveFormsModule,
    MatButtonModule, MatFormFieldModule,
    MatIconModule, MatProgressSpinnerModule, MatSelectModule,
    PivotComponent,
  ],
  templateUrl: './bonus-batch.html',
  styleUrl:    './bonus-batch.scss',
})
export class BonusBatch {
  private readonly fb         = inject(FormBuilder);
  private readonly batchSvc   = inject(BatchService);
  private readonly destroyRef = inject(DestroyRef);

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

  // ── State ──────────────────────────────────────────────────────────────
  readonly loading     = signal(false);
  readonly saving      = signal(false);
  readonly saveError   = signal<string | null>(null);
  readonly saveSuccess = signal(false);

  private readonly _employees   = signal<BonusEmployee[]>([]);
  private readonly _names       = signal<string[]>([]);
  private readonly _labelToCode = signal<Record<string, string>>({});
  private readonly _matrix      = signal<Record<string, number[]>>({});

  readonly pivotRows = computed<PivotViewRow[]>(() =>
    this._employees().map((emp, idx) => ({ emp, idx }))
  );

  readonly bonusNames   = computed(() => this._names());
  readonly bonusMatrix  = computed(() => this._matrix());

  readonly bonusTotal = computed(() =>
    Object.values(this._matrix()).reduce(
      (total, col) => total + col.reduce((s, v) => s + v, 0), 0
    )
  );

  // ── Lifecycle ──────────────────────────────────────────────────────────
  constructor() { this._load(); }

  // ── Period change ──────────────────────────────────────────────────────
  onPeriodChange(): void {
    this._employees.set([]);
    this._names.set([]);
    this._labelToCode.set({});
    this._matrix.set({});
    this.saveSuccess.set(false);
    this.saveError.set(null);
    this._load();
  }

  // ── Pivot edit ─────────────────────────────────────────────────────────
  onAmountChange(e: PivotAmountChange): void {
    this._matrix.update(prev => {
      const col = [...(prev[e.code] ?? [])];
      col[e.empIndex] = e.amount;
      return { ...prev, [e.code]: col };
    });
  }

  // ── Save ───────────────────────────────────────────────────────────────
  save(): void {
    if (this.saving() || this.periodForm.invalid) return;
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

  // ── Private ────────────────────────────────────────────────────────────
  private _buildEntries(): BatchSaveEntry[] {
    const emps        = this._employees();
    const names       = this._names();
    const labelToCode = this._labelToCode();
    const matrix      = this._matrix();
    const entries: BatchSaveEntry[] = [];

    for (const name of names) {
      const code = labelToCode[name];
      if (!code) continue;
      for (let i = 0; i < emps.length; i++) {
        if (emps[i].id <= 0) continue;
        entries.push({
          componentCode: code,
          componentType: 'BONUS',
          employeeId:    emps[i].id,
          amount:        matrix[name]?.[i] ?? 0,
        });
      }
    }
    return entries;
  }

  private _load(): void {
    const { month, year } = this.periodForm.getRawValue();
    this.loading.set(true);
    this.batchSvc.load(month, year)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  resp => { this.loading.set(false); this._parsePivot(resp.bonuses ?? []); },
        error: ()   => this.loading.set(false),
      });
  }

  private _parsePivot(rows: PivotRow[]): void {
    const validRows = rows.filter(row => Number(row['id'] ?? row['ID']) > 0);
    if (!validRows.length) {
      this._employees.set([]);
      this._names.set([]);
      this._labelToCode.set({});
      this._matrix.set({});
      return;
    }

    const firstRow     = this._normalise(validRows[0]);
    const labelToCode: Record<string, string> = {};
    Object.keys(firstRow)
      .filter(k => k.endsWith('_label'))
      .forEach(labelKey => {
        const code = labelKey.replace(/_label$/, '');
        const name = String(firstRow[labelKey] ?? code);
        labelToCode[name] = code;
      });
    const names = Object.keys(labelToCode);

    const employees: BonusEmployee[] = validRows.map(raw => {
      const row = this._normalise(raw);
      return {
        id:   Number(row['id']),
        code: String(row['employee_no'] ?? ''),
        name: String(row['payroll_name'] || `${row['first_name'] ?? ''} ${row['last_name'] ?? ''}`.trim()),
      };
    });

    const matrix: Record<string, number[]> = {};
    for (const name of names) {
      const code = labelToCode[name];
      matrix[name] = validRows.map(raw => Number(this._normalise(raw)[code] ?? 0));
    }

    this._employees.set(employees);
    this._names.set(names);
    this._labelToCode.set(labelToCode);
    this._matrix.set(matrix);
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
