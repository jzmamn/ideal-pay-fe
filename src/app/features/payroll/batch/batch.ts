import {
  ChangeDetectionStrategy, Component, DestroyRef,
  computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import {
  BatchService, BatchLoadResponse, BatchSaveEntry, BatchSavePayload, PivotRow,
} from './batch.service';
import { PivotComponent, PivotAmountChange } from '../../../shared/components/pivot/pivot';

// ── Constants ─────────────────────────────────────────────────────────────

/** Fields returned by every SP that are NOT component columns */
const FIXED_SP_FIELDS = new Set([
  'id', 'employee_no', 'first_name', 'last_name', 'payroll_name', 'basic_salary',
]);

/**
 * Maps each backend section key → component type sent in the save payload.
 * Loans / Bonus are future — no backend section yet.
 */
const SECTION_CONFIG = [
  { backendKey: 'fixedAllowances',    uiKey: 'fixedAlw',  label: 'Fixed Allowance',    type: 'FA'    },
  { backendKey: 'variableAllowances', uiKey: 'varAlw',    label: 'Variable Allowance', type: 'VA'    },
  { backendKey: 'overtimes',          uiKey: 'overtime',  label: 'Overtime',           type: 'OT'    },
  { backendKey: 'fixedDeductions',    uiKey: 'fixedDed',  label: 'Fixed Deduction',    type: 'FD'    },
  { backendKey: 'variableDeductions', uiKey: 'varDed',    label: 'Variable Deduction', type: 'VD'    },
  { backendKey: 'nopays',             uiKey: 'nopay',     label: 'NoPay',              type: 'NOPAY' },
  // Not yet backed by an SP — shown as empty tabs
  { backendKey: null,                 uiKey: 'loans',     label: 'Loans',              type: null    },
  { backendKey: null,                 uiKey: 'bonus',     label: 'Bonus',              type: null    },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────

interface BatchEmployee { id: number; code: string; name: string; }
/** code → amounts indexed by employee position */
type AmountMatrix = Record<string, number[]>;
/** code → hours indexed by employee position  (OT only) */
type HoursMatrix  = Record<string, number[]>;
/** code → days  indexed by employee position  (NOPAY only) */
type DaysMatrix   = Record<string, number[]>;

// ── Pivot helpers ─────────────────────────────────────────────────────────

/**
 * Extract active component codes from an SP pivot result.
 * For OT/NoPay returns the base code (strips _amount / _hours / _days suffix).
 */
function extractCodes(rows: PivotRow[], type: string): string[] {
  if (!rows.length) return [];
  const keys = Object.keys(rows[0]).filter(k => !FIXED_SP_FIELDS.has(k));
  if (type === 'OT' || type === 'NOPAY') {
    return [...new Set(
      keys
        .filter(k => k.endsWith('_amount'))
        .map(k => k.replace(/_amount$/, ''))
    )];
  }
  return keys;
}

/** Build amount matrix from SP rows */
function buildAmountMatrix(rows: PivotRow[], codes: string[], type: string): AmountMatrix {
  return Object.fromEntries(
    codes.map(code => {
      const col = (type === 'OT' || type === 'NOPAY') ? `${code}_amount` : code;
      return [code, rows.map(row => Number(row[col] ?? 0))];
    })
  );
}

/** Build hours matrix from OT SP rows */
function buildHoursMatrix(rows: PivotRow[], codes: string[]): HoursMatrix {
  return Object.fromEntries(
    codes.map(code => [code, rows.map(row => Number(row[`${code}_hours`] ?? 0))])
  );
}

/** Build days matrix from NoPay SP rows */
function buildDaysMatrix(rows: PivotRow[], codes: string[]): DaysMatrix {
  return Object.fromEntries(
    codes.map(code => [code, rows.map(row => Number(row[`${code}_days`] ?? 0))])
  );
}

/** Extract employee list from SP pivot rows (excludes default row id = -1) */
function extractEmployees(rows: PivotRow[]): BatchEmployee[] {
  return rows
    .filter(row => Number(row['id']) > 0)
    .map(row => ({
      id:   Number(row['id']),
      code: String(row['employee_no'] ?? ''),
      name: String(row['payroll_name'] || `${row['first_name'] ?? ''} ${row['last_name'] ?? ''}`.trim()),
    }));
}

/** Build an empty amount matrix initialised to 0 */
function emptyMatrix(emps: BatchEmployee[], codes: string[]): AmountMatrix {
  return Object.fromEntries(codes.map(c => [c, emps.map(() => 0)]));
}

// ── Component ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-batch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    MatTabsModule,
    PivotComponent,
  ],
  templateUrl: './batch.html',
  styleUrl:    './batch.scss',
})
export class BatchComponent {
  private readonly fb         = inject(FormBuilder);
  private readonly batchSvc   = inject(BatchService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Tab config (static — labels never change) ──────────────────────────
  readonly SUB_STEPS = SECTION_CONFIG;

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
    month: this.fb.nonNullable.control(
      this._today.getMonth() + 1,
      [Validators.required, Validators.min(1)],
    ),
    year: this.fb.nonNullable.control(
      this._today.getFullYear(),
      Validators.required,
    ),
  });

  // ── State signals ──────────────────────────────────────────────────────
  readonly saving          = signal(false);
  readonly saveError       = signal<string | null>(null);
  readonly saveSuccess     = signal(false);
  readonly loading         = signal(false);
  readonly selectedSubStep = signal(0);

  /** Active employees — populated from the first non-empty SP section */
  private readonly _employees = signal<BatchEmployee[]>([]);

  /** Amount matrices per section key */
  private readonly _matrices  = signal<Record<string, AmountMatrix>>({});

  /** Hours matrices for OT section */
  private readonly _hours     = signal<HoursMatrix>({});

  /** Days matrices for NoPay section */
  private readonly _days      = signal<DaysMatrix>({});

  /** Dynamic codes per section key — filled from SP result */
  private readonly _codes     = signal<Record<string, string[]>>({});

  // ── Computed ───────────────────────────────────────────────────────────

  readonly pivotRows = computed(() =>
    this._employees().map((emp, idx) => ({ emp, idx }))
  );

  readonly matrices = computed(() => this._matrices());

  readonly grandTotal = computed(() => {
    const mats = this._matrices();
    return Object.values(mats).reduce((total, mat) =>
      total + Object.values(mat).reduce((s, col) =>
        s + col.reduce((a, v) => a + v, 0), 0), 0);
  });

  /** Codes for each tab — resolved from SP result or empty array */
  codesFor(uiKey: string): string[] {
    return this._codes()[uiKey] ?? [];
  }

  get periodLabel(): string {
    const { month, year } = this.periodForm.getRawValue();
    return `${this.months.find(x => x.value === month)?.label ?? ''} ${year}`;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────

  constructor() {
    this._loadValues();
  }

  // ── Event handlers ─────────────────────────────────────────────────────

  onAmountChange(uiKey: string, e: PivotAmountChange): void {
    this._matrices.update(prev => {
      const mat = { ...(prev[uiKey] ?? {}) };
      const col = [...(mat[e.code] ?? [])];
      col[e.empIndex] = e.amount;
      mat[e.code] = col;
      return { ...prev, [uiKey]: mat };
    });
  }

  onPeriodChange(): void {
    // Reset all state then reload
    this._employees.set([]);
    this._matrices.set({});
    this._hours.set({});
    this._days.set({});
    this._codes.set({});
    this._loadValues();
  }

  save(): void {
    if (this.saving() || this.periodForm.invalid) return;
    this.saving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(false);

    const { month, year } = this.periodForm.getRawValue();
    const emps    = this._employees();
    const mats    = this._matrices();
    const hours   = this._hours();
    const days    = this._days();
    const entries: BatchSaveEntry[] = [];

    for (const cfg of SECTION_CONFIG) {
      if (!cfg.type || !cfg.backendKey) continue;   // Loans/Bonus — skip
      const codes = this._codes()[cfg.uiKey] ?? [];
      for (const code of codes) {
        for (let i = 0; i < emps.length; i++) {
          const amount = mats[cfg.uiKey]?.[code]?.[i] ?? 0;
          const entry: BatchSaveEntry = {
            componentCode: code,
            componentType: cfg.type,
            employeeId:    emps[i].id,
            amount,
          };
          if (cfg.type === 'OT') {
            entry.hours = hours[code]?.[i] ?? 0;
          }
          if (cfg.type === 'NOPAY') {
            entry.days = days[code]?.[i] ?? 0;
          }
          entries.push(entry);
        }
      }
    }

    // TODO: replace 1 with the current user ID from your AuthService
    const modifiedBy = 1;

    this.batchSvc
      .save({ periodMonth: month, periodYear: year, entries } satisfies BatchSavePayload, modifiedBy)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.saving.set(false); this.saveSuccess.set(true); },
        error: (err: unknown) => {
          this.saving.set(false);
          this.saveError.set(
            err instanceof Error ? err.message : 'Save failed. Please try again.'
          );
        },
      });
  }

  // ── Private ────────────────────────────────────────────────────────────

  private _loadValues(): void {
    const { month, year } = this.periodForm.getRawValue();
    this.loading.set(true);

    this.batchSvc.load(month, year)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  resp => { this.loading.set(false); this._applyLoadResponse(resp); },
        error: ()   => this.loading.set(false),
      });
  }

  private _applyLoadResponse(resp: BatchLoadResponse): void {
    const newCodes:   Record<string, string[]>     = {};
    const newMats:    Record<string, AmountMatrix>  = {};
    const newHours:   HoursMatrix                  = {};
    const newDays:    DaysMatrix                   = {};
    let   employees:  BatchEmployee[]              = [];

    for (const cfg of SECTION_CONFIG) {
      if (!cfg.backendKey || !cfg.type) continue;

      const rows = resp[cfg.backendKey as keyof BatchLoadResponse] ?? [];

      // Extract employees from the first non-empty section
      if (!employees.length && rows.length) {
        employees = extractEmployees(rows);
      }

      const codes = extractCodes(rows, cfg.type);
      newCodes[cfg.uiKey]  = codes;
      newMats[cfg.uiKey]   = rows.length
        ? buildAmountMatrix(rows, codes, cfg.type)
        : emptyMatrix(employees, codes);

      if (cfg.type === 'OT') {
        const otCodes = codes;
        otCodes.forEach(code => {
          newHours[code] = rows.length
            ? buildHoursMatrix(rows, [code])[code]
            : employees.map(() => 0);
        });
      }

      if (cfg.type === 'NOPAY') {
        const npCodes = codes;
        npCodes.forEach(code => {
          newDays[code] = rows.length
            ? buildDaysMatrix(rows, [code])[code]
            : employees.map(() => 0);
        });
      }
    }

    this._employees.set(employees);
    this._codes.set(newCodes);
    this._matrices.set(newMats);
    this._hours.set(newHours);
    this._days.set(newDays);
  }
}
