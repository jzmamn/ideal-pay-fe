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

const FIXED_SP_FIELDS = new Set([
  'id', 'employee_no', 'first_name', 'last_name', 'payroll_name', 'basic_salary',
]);

const SECTION_CONFIG = [
  { backendKey: 'fixedAllowances',    uiKey: 'fixedAlw',  label: 'Fixed Allowance',    type: 'FA'      },
  { backendKey: 'variableAllowances', uiKey: 'varAlw',    label: 'Variable Allowance', type: 'VA'      },
  { backendKey: 'overtimes',          uiKey: 'overtime',  label: 'Overtime',           type: 'OT'      },
  { backendKey: 'fixedDeductions',    uiKey: 'fixedDed',  label: 'Fixed Deduction',    type: 'FD'      },
  { backendKey: 'variableDeductions', uiKey: 'varDed',    label: 'Variable Deduction', type: 'VD'      },
  { backendKey: 'nopays',             uiKey: 'nopay',     label: 'NoPay',              type: 'NOPAY'   },
  { backendKey: 'salaryAdvances',   uiKey: 'salAdv',   label: 'Salary Advance',    type: 'SAL_ADV'  },
  { backendKey: 'bonuses',          uiKey: 'bonus',    label: 'Bonus',             type: 'BONUS'    },
  { backendKey: 'loans',            uiKey: 'loans',    label: 'Loans',             type: 'LOAN'     },
  { backendKey: 'salaryIncrements', uiKey: 'salIncr',  label: 'Salary Increment',  type: 'SAL_INCR' },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────

interface BatchEmployee { id: number; code: string; name: string; }

type AmountMatrix = Record<string, number[]>;
type HoursMatrix  = Record<string, number[]>;

export interface NopayFlatRow {
  empId:         number;
  employeeNo:    string;
  payrollName:   string;
  nopayRule:     string | null;
  nopayRuleDays: number | null;
  nopayCode:     string | null;
  days:          number;
  amount:        number;
}

export interface SalAdvFlatRow {
  empId:       number;
  employeeNo:  string;
  payrollName: string;
  amount:      number;
  isProcessed: boolean;
}

export interface SimpleFlatRow {
  empId:       number;
  employeeNo:  string;
  payrollName: string;
  amount:      number;
  isProcessed: boolean;
}

// ── Pivot helpers ─────────────────────────────────────────────────────────

function extractComponents(rows: PivotRow[]): { names: string[]; labelToCode: Record<string, string> } {
  if (!rows.length) return { names: [], labelToCode: {} };
  const labelToCode: Record<string, string> = {};
  Object.keys(rows[0])
    .filter(k => k.endsWith('_label') && !FIXED_SP_FIELDS.has(k))
    .forEach(labelCol => {
      const code = labelCol.replace(/_label$/, '');
      const name = String(rows[0][labelCol] ?? code);
      labelToCode[name] = code;
    });
  return { names: Object.keys(labelToCode), labelToCode };
}

function buildAmountMatrix(
  rows: PivotRow[], names: string[], labelToCode: Record<string, string>, type: string
): AmountMatrix {
  return Object.fromEntries(
    names.map(name => {
      const code   = labelToCode[name];
      const colKey = type === 'OT' ? `${code}_amount` : code;
      return [name, rows.map(row => Number(row[colKey] ?? 0))];
    })
  );
}

function buildHoursMatrix(rows: PivotRow[], names: string[], labelToCode: Record<string, string>): HoursMatrix {
  return Object.fromEntries(
    names.map(name => [name, rows.map(row => Number(row[`${labelToCode[name]}_hours`] ?? 0))])
  );
}

function extractEmployees(rows: PivotRow[]): BatchEmployee[] {
  return rows
    .filter(row => Number(row['id']) > 0)
    .map(row => ({
      id:   Number(row['id']),
      code: String(row['employee_no'] ?? ''),
      name: String(row['payroll_name'] || `${row['first_name'] ?? ''} ${row['last_name'] ?? ''}`.trim()),
    }));
}

function emptyMatrix(emps: BatchEmployee[], names: string[]): AmountMatrix {
  return Object.fromEntries(names.map(n => [n, emps.map(() => 0)]));
}

function normalisedRow(row: PivotRow): PivotRow {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.toLowerCase(), v])
  );
}

function buildNopayFlatRows(rows: PivotRow[]): NopayFlatRow[] {
  return rows
    .filter(row => Number(row['id'] ?? row['ID']) > 0)
    .map(raw => {
      const row = normalisedRow(raw);
      return {
        empId:         Number(row['id']),
        employeeNo:    String(row['employee_no'] ?? ''),
        payrollName:   String(row['payroll_name'] || `${row['first_name'] ?? ''} ${row['last_name'] ?? ''}`.trim()),
        nopayRule:     row['nopay_rule']      != null ? String(row['nopay_rule'])      : null,
        nopayRuleDays: row['nopay_rule_days'] != null ? Number(row['nopay_rule_days']) : null,
        nopayCode:     row['nopay_code']      != null ? String(row['nopay_code'])      : null,
        days:          Number(row['days']   ?? 0),
        amount:        Number(row['amount'] ?? 0),
      };
    });
}

function buildSalAdvFlatRows(rows: PivotRow[]): SalAdvFlatRow[] {
  return rows
    .filter(row => Number(row['id'] ?? row['ID']) > 0)
    .map(raw => {
      const row = normalisedRow(raw);
      return {
        empId:       Number(row['id']),
        employeeNo:  String(row['employee_no'] ?? ''),
        payrollName: String(row['payroll_name'] || `${row['first_name'] ?? ''} ${row['last_name'] ?? ''}`.trim()),
        amount:      Number(row['sal_adv_amount'] ?? 0),
        isProcessed: String(row['is_processed']) === 'Y',
      };
    });
}

/** Builds flat rows for simple single-amount-per-employee pivots (bonus, sal_incr). */
function buildSimpleFlatRows(rows: PivotRow[], amountKey: string): SimpleFlatRow[] {
  return rows
    .filter(row => Number(row['id'] ?? row['ID']) > 0)
    .map(raw => {
      const row = normalisedRow(raw);
      return {
        empId:       Number(row['id']),
        employeeNo:  String(row['employee_no'] ?? ''),
        payrollName: String(row['payroll_name'] || `${row['first_name'] ?? ''} ${row['last_name'] ?? ''}`.trim()),
        amount:      Number(row[amountKey] ?? 0),
        isProcessed: String(row['is_processed']) === 'Y',
      };
    });
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
    month: this.fb.nonNullable.control(this._today.getMonth() + 1, [Validators.required, Validators.min(1)]),
    year:  this.fb.nonNullable.control(this._today.getFullYear(), Validators.required),
  });

  // ── State ──────────────────────────────────────────────────────────────
  readonly saving          = signal(false);
  readonly saveError       = signal<string | null>(null);
  readonly saveSuccess     = signal(false);
  readonly loading         = signal(false);
  readonly selectedSubStep = signal(0);

  private readonly _employees   = signal<BatchEmployee[]>([]);
  private readonly _matrices    = signal<Record<string, AmountMatrix>>({});
  private readonly _hours       = signal<Record<string, HoursMatrix>>({});
  private readonly _labelToCode = signal<Record<string, Record<string, string>>>({});
  private readonly _names       = signal<Record<string, string[]>>({});
  private readonly _nopayRows   = signal<NopayFlatRow[]>([]);
  private readonly _salAdvRows  = signal<SalAdvFlatRow[]>([]);

  // ── NoPay table state ─────────────────────────────────────────────────
  readonly nopayFilter   = signal('');
  readonly nopayEditCtrl = this.fb.nonNullable.control(0);
  private readonly _nopayEditCell = signal<{ idx: number; field: 'days' | 'amount' } | null>(null);

  // ── Salary Advance table state ─────────────────────────────────────────
  readonly salAdvFilter   = signal('');
  readonly salAdvEditCtrl = this.fb.nonNullable.control(0);
  private readonly _salAdvEditCell = signal<number | null>(null);

  // ── Bonus table state ──────────────────────────────────────────────────
  private readonly _bonusRows    = signal<SimpleFlatRow[]>([]);
  readonly bonusFilter           = signal('');
  readonly bonusEditCtrl         = this.fb.nonNullable.control(0);
  private readonly _bonusEditCell = signal<number | null>(null);

  // ── Loan table state ───────────────────────────────────────────────────
  private readonly _loanRows     = signal<SimpleFlatRow[]>([]);
  readonly loanFilter            = signal('');

  // ── Salary Increment table state ───────────────────────────────────────
  private readonly _salIncrRows  = signal<SimpleFlatRow[]>([]);
  readonly salIncrFilter         = signal('');
  readonly salIncrEditCtrl       = this.fb.nonNullable.control(0);
  private readonly _salIncrEditCell = signal<number | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────

  readonly pivotRows = computed(() =>
    this._employees().map((emp, idx) => ({ emp, idx }))
  );

  readonly matrices = computed(() => this._matrices());

  readonly filteredNopayRows = computed(() => {
    const filter = this.nopayFilter().toLowerCase().trim();
    return this._nopayRows()
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) =>
        !filter ||
        row.payrollName.toLowerCase().includes(filter) ||
        row.employeeNo.toLowerCase().includes(filter)
      );
  });

  readonly nopayRowsCount   = computed(() => this._nopayRows().length);
  readonly nopayDaysTotal   = computed(() => this._nopayRows().reduce((s, r) => s + r.days,   0));
  readonly nopayAmountTotal = computed(() => this._nopayRows().reduce((s, r) => s + r.amount, 0));

  readonly filteredSalAdvRows = computed(() => {
    const filter = this.salAdvFilter().toLowerCase().trim();
    return this._salAdvRows()
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) =>
        !filter ||
        row.payrollName.toLowerCase().includes(filter) ||
        row.employeeNo.toLowerCase().includes(filter)
      );
  });

  readonly salAdvRowsCount   = computed(() => this._salAdvRows().length);
  readonly salAdvAmountTotal = computed(() => this._salAdvRows().reduce((s, r) => s + r.amount, 0));

  readonly filteredBonusRows = computed(() => {
    const f = this.bonusFilter().toLowerCase().trim();
    return this._bonusRows().map((row, idx) => ({ row, idx }))
      .filter(({ row }) => !f || row.payrollName.toLowerCase().includes(f) || row.employeeNo.toLowerCase().includes(f));
  });
  readonly bonusRowsCount   = computed(() => this._bonusRows().length);
  readonly bonusAmountTotal = computed(() => this._bonusRows().reduce((s, r) => s + r.amount, 0));

  readonly filteredLoanRows = computed(() => {
    const f = this.loanFilter().toLowerCase().trim();
    return this._loanRows().map((row, idx) => ({ row, idx }))
      .filter(({ row }) => !f || row.payrollName.toLowerCase().includes(f) || row.employeeNo.toLowerCase().includes(f));
  });
  readonly loanRowsCount   = computed(() => this._loanRows().length);
  readonly loanAmountTotal = computed(() => this._loanRows().reduce((s, r) => s + r.amount, 0));

  readonly filteredSalIncrRows = computed(() => {
    const f = this.salIncrFilter().toLowerCase().trim();
    return this._salIncrRows().map((row, idx) => ({ row, idx }))
      .filter(({ row }) => !f || row.payrollName.toLowerCase().includes(f) || row.employeeNo.toLowerCase().includes(f));
  });
  readonly salIncrRowsCount   = computed(() => this._salIncrRows().length);
  readonly salIncrAmountTotal = computed(() => this._salIncrRows().reduce((s, r) => s + r.amount, 0));

  readonly grandTotal = computed(() =>
    Object.values(this._matrices()).reduce((total, mat) =>
      total + Object.values(mat).reduce((s, col) =>
        s + col.reduce((a, v) => a + v, 0), 0), 0)
    + this.nopayAmountTotal()
    + this.salAdvAmountTotal()
    + this.bonusAmountTotal()
    + this.loanAmountTotal()
    + this.salIncrAmountTotal()
  );

  namesFor(uiKey: string): string[] {
    return this._names()[uiKey] ?? [];
  }

  get periodLabel(): string {
    const { month, year } = this.periodForm.getRawValue();
    return `${this.months.find(x => x.value === month)?.label ?? ''} ${year}`;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────

  constructor() {
    this._loadValues();
  }

  // ── Event handlers — pivot tabs ────────────────────────────────────────

  onAmountChange(uiKey: string, e: PivotAmountChange): void {
    this._matrices.update(prev => {
      const mat = { ...(prev[uiKey] ?? {}) };
      const col = [...(mat[e.code] ?? [])];
      col[e.empIndex] = e.amount;
      mat[e.code] = col;
      return { ...prev, [uiKey]: mat };
    });
  }

  // ── Event handlers — nopay table ──────────────────────────────────────

  isNopayEditing(idx: number, field: 'days' | 'amount'): boolean {
    const c = this._nopayEditCell();
    return c?.idx === idx && c?.field === field;
  }

  startNopayEdit(idx: number, field: 'days' | 'amount'): void {
    const row = this._nopayRows()[idx];
    if (!row) return;
    this.nopayEditCtrl.setValue(field === 'days' ? row.days : row.amount);
    this._nopayEditCell.set({ idx, field });
  }

  saveNopayEdit(): void {
    const cell = this._nopayEditCell();
    if (!cell) return;
    const value = this.nopayEditCtrl.value;
    this._nopayRows.update(rows => {
      const updated = [...rows];
      updated[cell.idx] = { ...updated[cell.idx], [cell.field]: isNaN(value) ? 0 : value };
      return updated;
    });
    this._nopayEditCell.set(null);
  }

  cancelNopayEdit(): void {
    this._nopayEditCell.set(null);
  }

  onNopayChange(idx: number, field: 'days' | 'amount', value: number): void {
    this._nopayRows.update(rows => {
      const updated = [...rows];
      updated[idx] = { ...updated[idx], [field]: isNaN(value) ? 0 : value };
      return updated;
    });
  }

  // ── Event handlers — salary advance table ─────────────────────────────

  isSalAdvEditing(idx: number): boolean {
    return this._salAdvEditCell() === idx;
  }

  startSalAdvEdit(idx: number): void {
    const row = this._salAdvRows()[idx];
    if (!row || row.isProcessed) return;
    this.salAdvEditCtrl.setValue(row.amount);
    this._salAdvEditCell.set(idx);
  }

  saveSalAdvEdit(): void {
    const idx = this._salAdvEditCell();
    if (idx === null) return;
    const value = this.salAdvEditCtrl.value;
    this._salAdvRows.update(rows => {
      const updated = [...rows];
      updated[idx] = { ...updated[idx], amount: isNaN(value) ? 0 : value };
      return updated;
    });
    this._salAdvEditCell.set(null);
  }

  cancelSalAdvEdit(): void {
    this._salAdvEditCell.set(null);
  }

  // ── Event handlers — bonus table ───────────────────────────────────────

  isBonusEditing(idx: number): boolean { return this._bonusEditCell() === idx; }

  startBonusEdit(idx: number): void {
    const row = this._bonusRows()[idx];
    if (!row || row.isProcessed) return;
    this.bonusEditCtrl.setValue(row.amount);
    this._bonusEditCell.set(idx);
  }

  saveBonusEdit(): void {
    const idx = this._bonusEditCell();
    if (idx === null) return;
    const value = this.bonusEditCtrl.value;
    this._bonusRows.update(rows => { const u = [...rows]; u[idx] = { ...u[idx], amount: isNaN(value) ? 0 : value }; return u; });
    this._bonusEditCell.set(null);
  }

  cancelBonusEdit(): void { this._bonusEditCell.set(null); }

  // ── Event handlers — salary increment table ────────────────────────────

  isSalIncrEditing(idx: number): boolean { return this._salIncrEditCell() === idx; }

  startSalIncrEdit(idx: number): void {
    const row = this._salIncrRows()[idx];
    if (!row || row.isProcessed) return;
    this.salIncrEditCtrl.setValue(row.amount);
    this._salIncrEditCell.set(idx);
  }

  saveSalIncrEdit(): void {
    const idx = this._salIncrEditCell();
    if (idx === null) return;
    const value = this.salIncrEditCtrl.value;
    this._salIncrRows.update(rows => { const u = [...rows]; u[idx] = { ...u[idx], amount: isNaN(value) ? 0 : value }; return u; });
    this._salIncrEditCell.set(null);
  }

  cancelSalIncrEdit(): void { this._salIncrEditCell.set(null); }

  // ── Period change ──────────────────────────────────────────────────────

  onPeriodChange(): void {
    this._employees.set([]);
    this._matrices.set({});
    this._hours.set({});
    this._names.set({});
    this._labelToCode.set({});
    this._nopayRows.set([]);
    this._salAdvRows.set([]);
    this._bonusRows.set([]);
    this._loanRows.set([]);
    this._salIncrRows.set([]);
    this.nopayFilter.set('');
    this.salAdvFilter.set('');
    this.bonusFilter.set('');
    this.loanFilter.set('');
    this.salIncrFilter.set('');
    this._nopayEditCell.set(null);
    this._salAdvEditCell.set(null);
    this._bonusEditCell.set(null);
    this._salIncrEditCell.set(null);
    this._loadValues();
  }

  // ── Save ───────────────────────────────────────────────────────────────

  save(): void {
    if (this.saving() || this.periodForm.invalid) return;
    this.saveNopayEdit();
    this.saveSalAdvEdit();
    this.saveBonusEdit();
    this.saveSalIncrEdit();
    this.saving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(false);

    const { month, year } = this.periodForm.getRawValue();
    const emps        = this._employees();
    const mats        = this._matrices();
    const hoursMap    = this._hours();
    const labelToCode = this._labelToCode();
    const entries: BatchSaveEntry[] = [];

    // ── Pivot sections (FA, FD, VA, VD, OT) ───────────────────────────
    for (const cfg of SECTION_CONFIG) {
      if (!cfg.type || !cfg.backendKey || cfg.type === 'NOPAY' || cfg.type === 'SAL_ADV') continue;
      const names   = this._names()[cfg.uiKey] ?? [];
      const codeMap = labelToCode[cfg.uiKey] ?? {};

      for (const name of names) {
        const code = codeMap[name];
        if (!code) continue;
        for (let i = 0; i < emps.length; i++) {
          const amount = mats[cfg.uiKey]?.[name]?.[i] ?? 0;
          const entry: BatchSaveEntry = {
            componentCode: code,
            componentType: cfg.type,
            employeeId:    emps[i].id,
            amount,
          };
          if (cfg.type === 'OT') { entry.hours = hoursMap[cfg.uiKey]?.[name]?.[i] ?? 0; }
          entries.push(entry);
        }
      }
    }

    // ── Flat nopay rows ────────────────────────────────────────────────
    for (const row of this._nopayRows()) {
      if (!row.nopayCode) continue;
      entries.push({
        componentCode: row.nopayCode,
        componentType: 'NOPAY',
        employeeId:    row.empId,
        amount:        row.amount,
        days:          row.days,
      });
    }

    // ── Salary advance rows ────────────────────────────────────────────
    for (const row of this._salAdvRows()) {
      if (row.isProcessed) continue;
      entries.push({ componentCode: 'SAL_ADV', componentType: 'SAL_ADV', employeeId: row.empId, amount: row.amount });
    }

    // ── Bonus rows ─────────────────────────────────────────────────────
    for (const row of this._bonusRows()) {
      if (row.isProcessed) continue;
      entries.push({ componentCode: 'BONUS', componentType: 'BONUS', employeeId: row.empId, amount: row.amount });
    }

    // ── Loan rows (dynamic — loan code comes from pivot label) ─────────
    for (const row of this._loanRows()) {
      if (row.isProcessed) continue;
      entries.push({ componentCode: 'DEFAULT', componentType: 'LOAN', employeeId: row.empId, amount: row.amount });
    }

    // ── Salary increment rows ──────────────────────────────────────────
    for (const row of this._salIncrRows()) {
      if (row.isProcessed) continue;
      entries.push({ componentCode: 'SAL_INCR', componentType: 'SAL_INCR', employeeId: row.empId, amount: row.amount });
    }

    const modifiedBy = 1; // TODO: replace with AuthService user id

    this.batchSvc
      .save({ periodMonth: month, periodYear: year, entries } satisfies BatchSavePayload, modifiedBy)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.saving.set(false); this.saveSuccess.set(true); },
        error: (err: unknown) => {
          this.saving.set(false);
          this.saveError.set(err instanceof Error ? err.message : 'Save failed. Please try again.');
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
    const newMats:        Record<string, AmountMatrix>           = {};
    const newHours:       Record<string, HoursMatrix>            = {};
    const newNames:       Record<string, string[]>               = {};
    const newLabelToCode: Record<string, Record<string, string>> = {};
    let   employees:      BatchEmployee[]                        = [];

    for (const cfg of SECTION_CONFIG) {
      if (!cfg.backendKey || !cfg.type || cfg.type === 'NOPAY' || cfg.type === 'SAL_ADV') continue;

      const rows = (resp[cfg.backendKey as keyof BatchLoadResponse] ?? [])
        .filter(row => Number(row['id']) > 0);

      if (!employees.length && rows.length) {
        employees = extractEmployees(rows);
      }

      const { names, labelToCode } = extractComponents(rows);
      newNames[cfg.uiKey]       = names;
      newLabelToCode[cfg.uiKey] = labelToCode;

      newMats[cfg.uiKey] = rows.length
        ? buildAmountMatrix(rows, names, labelToCode, cfg.type)
        : emptyMatrix(employees, names);

      if (cfg.type === 'OT') {
        newHours[cfg.uiKey] = rows.length
          ? buildHoursMatrix(rows, names, labelToCode)
          : emptyMatrix(employees, names);
      }
    }

    this._nopayRows.set(buildNopayFlatRows(resp.nopays ?? []));
    this._salAdvRows.set(buildSalAdvFlatRows(resp.salaryAdvances ?? []));
    this._bonusRows.set(buildSimpleFlatRows(resp.bonuses ?? [],          'bonus_amount'));
    this._loanRows.set(buildSimpleFlatRows(resp.loans ?? [],             'no_active_components'));
    this._salIncrRows.set(buildSimpleFlatRows(resp.salaryIncrements ?? [],'sal_incr_amount'));

    this._employees.set(employees);
    this._names.set(newNames);
    this._labelToCode.set(newLabelToCode);
    this._matrices.set(newMats);
    this._hours.set(newHours);
  }
}
