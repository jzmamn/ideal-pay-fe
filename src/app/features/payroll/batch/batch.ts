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
import { HttpErrorResponse } from '@angular/common/http';
import {
  BatchService, BatchLoadResponse, BatchSaveEntry, BatchSavePayload, PivotRow,
} from './batch.service';
import { PivotComponent, PivotAmountChange } from '../../../shared/components/pivot/pivot';
import { PayrollRunService } from '../shared/payroll-run.service';
import { PayrollRunSummary } from '../shared/payroll-run.model';
import { PayrollDraftViewComponent } from '../shared/payroll-draft-view/payroll-draft-view';

// ── Constants ─────────────────────────────────────────────────────────────

const FIXED_SP_FIELDS = new Set([
  'id', 'employee_no', 'first_name', 'last_name', 'payroll_name', 'basic_salary',
]);

/**
 * Pivot sections rendered via PivotComponent.
 * OT and NoPay are handled as flat tables and excluded here.
 * readOnly=true means amounts loaded by the server cannot be changed.
 */
const SECTION_CONFIG = [
  { backendKey: 'fixedAllowances',    uiKey: 'fixedAlw',  label: 'Fixed Allowance',    type: 'FA', readOnly: true  },
  { backendKey: 'variableAllowances', uiKey: 'varAlw',    label: 'Variable Allowance', type: 'VA', readOnly: false },
  { backendKey: 'fixedDeductions',    uiKey: 'fixedDed',  label: 'Fixed Deduction',    type: 'FD', readOnly: true  },
  { backendKey: 'variableDeductions', uiKey: 'varDed',    label: 'Variable Deduction', type: 'VD', readOnly: false },
] as const;

// ── Types ─────────────────────────────────────────────────────────────────

interface BatchEmployee { id: number; code: string; name: string; }

type AmountMatrix = Record<string, number[]>;

/** One row in the OT flat table: employee × OT type. */
export interface OtFlatRow {
  empId:       number;
  employeeNo:  string;
  payrollName: string;
  otCode:      string;
  otLabel:     string;
  rate:        number;
  hours:       number;
  amount:      number;
}

/** One row in the NoPay flat table: employee × NoPay type. */
export interface NopayFlatRow {
  empId:       number;
  employeeNo:  string;
  payrollName: string;
  npCode:      string;
  npLabel:     string;
  rate:        number;
  days:        number;
  amount:      number;
}

export interface SalAdvFlatRow {
  empId:       number;
  employeeNo:  string;
  payrollName: string;
  amount:      number;
  isProcessed: boolean;
}

export interface LateFlatRow {
  empId:       number;
  employeeNo:  string;
  payrollName: string;
  rate:        number;
  hours:       number;
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
  rows: PivotRow[], names: string[], labelToCode: Record<string, string>,
): AmountMatrix {
  return Object.fromEntries(
    names.map(name => {
      const code = labelToCode[name];
      return [name, rows.map(row => Number(row[code] ?? 0))];
    })
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

/**
 * Builds flat rows from a dynamic pivot result (OT or NoPay).
 * The SP produces: {code}_rate, {code}_hours|_days, {code}_amount, {code}_label per active type.
 */
function buildCodePivotFlatRows(
  rows: PivotRow[],
  qtyKey: '_hours' | '_days',
): Array<{ empId: number; employeeNo: string; payrollName: string; code: string; label: string; rate: number; qty: number; amount: number }> {
  const result: ReturnType<typeof buildCodePivotFlatRows> = [];

  // Find active component codes from label columns
  const sampleRow = rows.find(r => Number(r['id']) > 0);
  if (!sampleRow) return result;
  const codes = Object.keys(sampleRow)
    .filter(k => k.endsWith('_label') && !FIXED_SP_FIELDS.has(k))
    .map(k => k.replace(/_label$/, ''));

  for (const raw of rows) {
    const row = normalisedRow(raw);
    const empId = Number(row['id'] ?? 0);
    if (empId <= 0) continue;
    const employeeNo  = String(row['employee_no'] ?? '');
    const payrollName = String(row['payroll_name'] || `${row['first_name'] ?? ''} ${row['last_name'] ?? ''}`.trim());

    for (const code of codes) {
      const rate   = Number(row[`${code}_rate`]   ?? 0);
      const qty    = Number(row[`${code}${qtyKey}`] ?? 0);
      const amount = Number(row[`${code}_amount`] ?? 0);
      const label  = String(row[`${code}_label`]  ?? code);
      result.push({ empId, employeeNo, payrollName, code, label, rate, qty, amount });
    }
  }
  return result;
}

function buildOtFlatRows(rows: PivotRow[]): OtFlatRow[] {
  return buildCodePivotFlatRows(rows, '_hours').map(r => ({
    empId: r.empId, employeeNo: r.employeeNo, payrollName: r.payrollName,
    otCode: r.code, otLabel: r.label, rate: r.rate, hours: r.qty, amount: r.amount,
  }));
}

function buildNopayFlatRows(rows: PivotRow[]): NopayFlatRow[] {
  return buildCodePivotFlatRows(rows, '_days').map(r => ({
    empId: r.empId, employeeNo: r.employeeNo, payrollName: r.payrollName,
    npCode: r.code, npLabel: r.label, rate: r.rate, days: r.qty, amount: r.amount,
  }));
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

function buildLateFlatRows(rows: PivotRow[]): LateFlatRow[] {
  return rows
    .filter(row => Number(row['id'] ?? row['ID']) > 0)
    .map(raw => {
      const row = normalisedRow(raw);
      return {
        empId:       Number(row['id']),
        employeeNo:  String(row['employee_no'] ?? ''),
        payrollName: String(row['payroll_name'] || `${row['first_name'] ?? ''} ${row['last_name'] ?? ''}`.trim()),
        rate:        Number(row['late_rate']   ?? 0),
        hours:       Number(row['late_hours']  ?? 0),
        amount:      Number(row['late_amount'] ?? 0),
        isProcessed: String(row['late_is_processed'] ?? 'N') === 'Y',
      };
    });
}

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
    PayrollDraftViewComponent,
  ],
  templateUrl: './batch.html',
  styleUrl:    './batch.scss',
})
export class BatchComponent {
  private readonly fb            = inject(FormBuilder);
  private readonly batchSvc      = inject(BatchService);
  private readonly payrollRunSvc = inject(PayrollRunService);
  private readonly destroyRef    = inject(DestroyRef);

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
  readonly saving               = signal(false);
  readonly saveError            = signal<string | null>(null);
  readonly saveSuccess          = signal(false);
  readonly loading              = signal(false);
  readonly loadingComponents    = signal(false);
  readonly loadComponentsError  = signal<string | null>(null);
  readonly loadComponentsInfo   = signal<string | null>(null);
  readonly selectedSubStep      = signal(0);

  // Draft view state
  readonly showDraft     = signal(false);
  readonly draftLoading  = signal(false);
  readonly draftReadOnly = signal(false);
  readonly draftRuns     = signal<PayrollRunSummary[]>([]);

  private readonly _employees   = signal<BatchEmployee[]>([]);
  private readonly _matrices    = signal<Record<string, AmountMatrix>>({});
  private readonly _labelToCode = signal<Record<string, Record<string, string>>>({});
  private readonly _names       = signal<Record<string, string[]>>({});

  // ── OT table state ─────────────────────────────────────────────────────
  private readonly _otRows   = signal<OtFlatRow[]>([]);
  readonly otFilter          = signal('');
  readonly otEditCtrl        = this.fb.nonNullable.control(0);
  private readonly _otEditCell = signal<{ idx: number } | null>(null);

  // ── NoPay table state ─────────────────────────────────────────────────
  private readonly _nopayRows    = signal<NopayFlatRow[]>([]);
  readonly nopayFilter           = signal('');
  readonly nopayEditCtrl         = this.fb.nonNullable.control(0);
  private readonly _nopayEditCell = signal<number | null>(null);

  // ── Salary Advance table state ─────────────────────────────────────────
  private readonly _salAdvRows      = signal<SalAdvFlatRow[]>([]);
  readonly salAdvFilter             = signal('');
  readonly salAdvEditCtrl           = this.fb.nonNullable.control(0);
  private readonly _salAdvEditCell  = signal<number | null>(null);

  // ── Loan table state ───────────────────────────────────────────────────
  private readonly _loanRows = signal<SimpleFlatRow[]>([]);
  readonly loanFilter        = signal('');

  // ── Salary Increment table state ───────────────────────────────────────
  private readonly _salIncrRows      = signal<SimpleFlatRow[]>([]);
  readonly salIncrFilter             = signal('');
  readonly salIncrEditCtrl           = this.fb.nonNullable.control(0);
  private readonly _salIncrEditCell  = signal<number | null>(null);

  // ── Late Deduction table state ─────────────────────────────────────────
  private readonly _lateRows     = signal<LateFlatRow[]>([]);
  readonly lateFilter            = signal('');
  readonly lateEditCtrl          = this.fb.nonNullable.control(0);
  private readonly _lateEditCell = signal<number | null>(null);

  // ── Computed ───────────────────────────────────────────────────────────

  readonly pivotRows = computed(() =>
    this._employees().map((emp, idx) => ({ emp, idx }))
  );

  readonly matrices = computed(() => this._matrices());

  readonly filteredOtRows = computed(() => {
    const f = this.otFilter().toLowerCase().trim();
    return this._otRows()
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => !f || row.payrollName.toLowerCase().includes(f) || row.employeeNo.toLowerCase().includes(f));
  });
  readonly otRowsCount   = computed(() => this._otRows().length);
  readonly otHoursTotal  = computed(() => this._otRows().reduce((s, r) => s + r.hours, 0));
  readonly otAmountTotal = computed(() => this._otRows().reduce((s, r) => s + r.amount, 0));

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

  readonly filteredLateRows = computed(() => {
    const f = this.lateFilter().toLowerCase().trim();
    return this._lateRows().map((row, idx) => ({ row, idx }))
      .filter(({ row }) => !f || row.payrollName.toLowerCase().includes(f) || row.employeeNo.toLowerCase().includes(f));
  });
  readonly lateRowsCount   = computed(() => this._lateRows().length);
  readonly lateHoursTotal  = computed(() => this._lateRows().reduce((s, r) => s + r.hours,  0));
  readonly lateAmountTotal = computed(() => this._lateRows().reduce((s, r) => s + r.amount, 0));

  readonly grandTotal = computed(() =>
    Object.values(this._matrices()).reduce((total, mat) =>
      total + Object.values(mat).reduce((s, col) =>
        s + col.reduce((a, v) => a + v, 0), 0), 0)
    + this.otAmountTotal()
    + this.nopayAmountTotal()
    + this.lateAmountTotal()
    + this.salAdvAmountTotal()
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

  // ── Event handlers — OT table ─────────────────────────────────────────

  isOtEditing(idx: number): boolean { return this._otEditCell()?.idx === idx; }

  startOtEdit(idx: number): void {
    const row = this._otRows()[idx];
    if (!row) return;
    this.otEditCtrl.setValue(row.hours);
    this._otEditCell.set({ idx });
  }

  saveOtEdit(): void {
    const cell = this._otEditCell();
    if (!cell) return;
    const hours = Math.max(0, this.otEditCtrl.value ?? 0);
    this._otRows.update(rows => {
      const updated = [...rows];
      const row = updated[cell.idx];
      const amount = parseFloat((row.rate * hours).toFixed(2));
      updated[cell.idx] = { ...row, hours, amount };
      return updated;
    });
    this._otEditCell.set(null);
  }

  cancelOtEdit(): void { this._otEditCell.set(null); }

  // ── Event handlers — nopay table ──────────────────────────────────────

  isNopayEditing(idx: number): boolean { return this._nopayEditCell() === idx; }

  startNopayEdit(idx: number): void {
    const row = this._nopayRows()[idx];
    if (!row) return;
    this.nopayEditCtrl.setValue(row.days);
    this._nopayEditCell.set(idx);
  }

  saveNopayEdit(): void {
    const idx = this._nopayEditCell();
    if (idx === null) return;
    const days = Math.max(0, this.nopayEditCtrl.value ?? 0);
    this._nopayRows.update(rows => {
      const updated = [...rows];
      const row = updated[idx];
      const amount = parseFloat((row.rate * days).toFixed(2));
      updated[idx] = { ...row, days, amount };
      return updated;
    });
    this._nopayEditCell.set(null);
  }

  cancelNopayEdit(): void { this._nopayEditCell.set(null); }

  // ── Event handlers — salary advance table ─────────────────────────────

  isSalAdvEditing(idx: number): boolean { return this._salAdvEditCell() === idx; }

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

  cancelSalAdvEdit(): void { this._salAdvEditCell.set(null); }

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

  // ── Event handlers — late deduction table ─────────────────────────────

  isLateEditing(idx: number): boolean { return this._lateEditCell() === idx; }

  startLateEdit(idx: number): void {
    const row = this._lateRows()[idx];
    if (!row || row.isProcessed) return;
    this.lateEditCtrl.setValue(row.hours);
    this._lateEditCell.set(idx);
  }

  saveLateEdit(): void {
    const idx = this._lateEditCell();
    if (idx === null) return;
    const hours = Math.max(0, this.lateEditCtrl.value ?? 0);
    this._lateRows.update(rows => {
      const updated = [...rows];
      const row = updated[idx];
      const amount = parseFloat((row.rate * hours).toFixed(2));
      updated[idx] = { ...row, hours, amount };
      return updated;
    });
    this._lateEditCell.set(null);
  }

  cancelLateEdit(): void { this._lateEditCell.set(null); }

  // ── Load components ────────────────────────────────────────────────────

  /**
   * Calls the backend load endpoint to evaluate formulas / use configured amounts
   * for all active employees, then refreshes the pivot data.
   */
  loadComponents(): void {
    if (this.loadingComponents() || this.periodForm.invalid) return;
    this.loadingComponents.set(true);
    this.loadComponentsError.set(null);
    this.loadComponentsInfo.set(null);

    const { month, year } = this.periodForm.getRawValue();
    const userId = 1; // TODO: replace with AuthService user id

    this.batchSvc.loadComponents(month, year, userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: summary => {
          const errs = summary.errors?.length ? ` (${summary.errors.length} errors)` : '';
          this.loadComponentsInfo.set(
            `Loaded — ${summary.employeesProcessed} employees, ${summary.recordsUpserted} records updated${errs}.`
          );
          this.loadingComponents.set(false);
          this._loadValues(); // refresh pivot
        },
        error: (err: unknown) => {
          this.loadingComponents.set(false);
          this.loadComponentsError.set(this.extractError(err, 'Load failed. Please try again.'));
        },
      });
  }

  // ── Period change ──────────────────────────────────────────────────────

  onPeriodChange(): void {
    this._employees.set([]);
    this._matrices.set({});
    this._names.set({});
    this._labelToCode.set({});
    this._otRows.set([]);
    this._nopayRows.set([]);
    this._salAdvRows.set([]);
    this._loanRows.set([]);
    this._salIncrRows.set([]);
    this._lateRows.set([]);
    this.otFilter.set('');
    this.nopayFilter.set('');
    this.salAdvFilter.set('');
    this.loanFilter.set('');
    this.salIncrFilter.set('');
    this.lateFilter.set('');
    this._otEditCell.set(null);
    this._nopayEditCell.set(null);
    this._salAdvEditCell.set(null);
    this._salIncrEditCell.set(null);
    this._lateEditCell.set(null);
    this.loadComponentsError.set(null);
    this.loadComponentsInfo.set(null);

    this._loadValues();
  }

  // ── Save ───────────────────────────────────────────────────────────────

  save(): void {
    if (this.saving() || this.periodForm.invalid) return;
    this.saveOtEdit();
    this.saveNopayEdit();
    this.saveSalAdvEdit();
    this.saveSalIncrEdit();
    this.saveLateEdit();
    this.saving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(false);

    const { month, year } = this.periodForm.getRawValue();
    const emps        = this._employees();
    const mats        = this._matrices();
    const labelToCode = this._labelToCode();
    const entries: BatchSaveEntry[] = [];

    // ── Pivot sections (FA, FD, VA, VD) ───────────────────────────────
    for (const cfg of SECTION_CONFIG) {
      const names   = this._names()[cfg.uiKey] ?? [];
      const codeMap = labelToCode[cfg.uiKey] ?? {};

      for (const name of names) {
        const code = codeMap[name];
        if (!code) continue;
        for (let i = 0; i < emps.length; i++) {
          if (emps[i].id <= 0) continue;
          const amount = mats[cfg.uiKey]?.[name]?.[i] ?? 0;
          entries.push({ componentCode: code, componentType: cfg.type, employeeId: emps[i].id, amount });
        }
      }
    }

    // ── OT flat rows ───────────────────────────────────────────────────
    for (const row of this._otRows()) {
      if (row.empId <= 0 || !row.otCode) continue;
      entries.push({
        componentCode: row.otCode,
        componentType: 'OT',
        employeeId:    row.empId,
        amount:        row.amount,
        hours:         row.hours,
      });
    }

    // ── Flat nopay rows ────────────────────────────────────────────────
    for (const row of this._nopayRows()) {
      if (!row.npCode || row.empId <= 0) continue;
      entries.push({
        componentCode: row.npCode,
        componentType: 'NOPAY',
        employeeId:    row.empId,
        amount:        row.amount,
        days:          row.days,
      });
    }

    // ── Salary advance rows ────────────────────────────────────────────
    for (const row of this._salAdvRows()) {
      if (row.isProcessed || row.empId <= 0) continue;
      entries.push({ componentCode: 'SAL_ADV', componentType: 'SAL_ADV', employeeId: row.empId, amount: row.amount });
    }

    // ── Salary increment rows ──────────────────────────────────────────
    for (const row of this._salIncrRows()) {
      if (row.isProcessed || row.empId <= 0) continue;
      entries.push({ componentCode: 'SAL_INCR', componentType: 'SAL_INCR', employeeId: row.empId, amount: row.amount });
    }

    // ── Late deduction rows ────────────────────────────────────────────
    for (const row of this._lateRows()) {
      if (row.isProcessed || row.empId <= 0 || row.hours <= 0) continue;
      entries.push({
        componentCode: 'LATE',
        componentType: 'LATE',
        employeeId:    row.empId,
        amount:        row.amount,
        hours:         row.hours,
      });
    }

    const modifiedBy = 1; // TODO: replace with AuthService user id

    this.batchSvc
      .save({ periodMonth: month, periodYear: year, entries } satisfies BatchSavePayload, modifiedBy)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const mm = String(month).padStart(2, '0');
          const payrollMonth = `${year}-${mm}`;
          this.payrollRunSvc.processBatch(payrollMonth, modifiedBy)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: runs => {
                this.saving.set(false);
                this.saveSuccess.set(true);
                this.draftRuns.set(runs);
                this.draftReadOnly.set(false);
                this.showDraft.set(true);
              },
              error: (err: unknown) => {
                this.saving.set(false);
                this.saveError.set(this.extractError(err, 'Payroll processing failed. Please try again.'));
              },
            });
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.saveError.set(this.extractError(err, 'Save failed. Please try again.'));
        },
      });
  }

  /** Re-process batch from the draft view. */
  reprocessBatch(): void {
    const { month, year } = this.periodForm.getRawValue();
    const mm = String(month).padStart(2, '0');
    const payrollMonth = `${year}-${mm}`;
    this.saving.set(true);
    this.saveError.set(null);
    this.payrollRunSvc.processBatch(payrollMonth, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: runs => { this.saving.set(false); this.draftRuns.set(runs); },
        error: (err: unknown) => {
          this.saving.set(false);
          this.saveError.set(this.extractError(err, 'Re-process failed. Please try again.'));
        },
      });
  }

  refreshBatchRuns(): void {
    const { month, year } = this.periodForm.getRawValue();
    const mm = String(month).padStart(2, '0');
    const payrollMonth = `${year}-${mm}`;
    this.payrollRunSvc.getByMonth(payrollMonth)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: runs => this.draftRuns.set(runs) });
  }

  viewDraft(): void {
    if (this.draftLoading() || this.periodForm.invalid) return;
    const { month, year } = this.periodForm.getRawValue();
    const mm = String(month).padStart(2, '0');
    const payrollMonth = `${year}-${mm}`;
    const modifiedBy = 1;
    this.draftLoading.set(true);
    this.saveError.set(null);
    this.payrollRunSvc.processBatch(payrollMonth, modifiedBy)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: runs => {
          this.draftLoading.set(false);
          this.draftRuns.set(runs);
          this.draftReadOnly.set(true);
          this.showDraft.set(true);
        },
        error: (err: unknown) => {
          this.draftLoading.set(false);
          this.saveError.set(this.extractError(err, 'Payroll processing failed. Please try again.'));
        },
      });
  }

  backToEntry(): void {
    this.showDraft.set(false);
    this.saveSuccess.set(false);
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private extractError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const msg = err.error?.message ?? err.error?.error ?? err.message;
      return msg || fallback;
    }
    if (err instanceof Error) return err.message;
    return fallback;
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
    const newNames:       Record<string, string[]>               = {};
    const newLabelToCode: Record<string, Record<string, string>> = {};
    let   employees:      BatchEmployee[]                        = [];

    for (const cfg of SECTION_CONFIG) {
      const rows = (resp[cfg.backendKey as keyof BatchLoadResponse] ?? [])
        .filter(row => Number(row['id']) > 0);

      if (!employees.length && rows.length) {
        employees = extractEmployees(rows);
      }

      const { names, labelToCode } = extractComponents(rows);
      newNames[cfg.uiKey]       = names;
      newLabelToCode[cfg.uiKey] = labelToCode;

      newMats[cfg.uiKey] = rows.length
        ? buildAmountMatrix(rows, names, labelToCode)
        : emptyMatrix(employees, names);
    }

    // OT flat rows (from pivot: {code}_rate, {code}_hours, {code}_amount)
    this._otRows.set(buildOtFlatRows(resp.overtimes ?? []));

    // NoPay flat rows (from pivot: {code}_rate, {code}_days, {code}_amount)
    this._nopayRows.set(buildNopayFlatRows(resp.nopays ?? []));

    this._salAdvRows.set(buildSalAdvFlatRows(resp.salaryAdvances ?? []));
    this._loanRows.set(buildSimpleFlatRows(resp.loans ?? [], 'no_active_components'));
    this._salIncrRows.set(buildSimpleFlatRows(resp.salaryIncrements ?? [], 'sal_incr_amount'));
    this._lateRows.set(buildLateFlatRows(resp.lates ?? []));

    this._employees.set(employees);
    this._names.set(newNames);
    this._labelToCode.set(newLabelToCode);
    this._matrices.set(newMats);
  }
}
