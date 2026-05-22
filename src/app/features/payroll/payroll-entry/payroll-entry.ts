import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  computed, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormArray, FormBuilder, FormControl, FormGroup,
  ReactiveFormsModule, Validators,
} from '@angular/forms';
import { map, startWith } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { type EmployeeModel } from '../../settings/employee/employee.model';
import { type TableColumn } from '../../../shared/components/table-autocomplete/table-autocomplete';
import { PayrollPrepareComponent } from '../payroll-prepare/payroll-prepare.component';
import { PayrollPrepareService } from '../payroll-prepare/shared/payroll-prepare.service';

type RowType = 'fixed' | 'percent';

interface PayrollRow {
  name: string;
  type: RowType;
  value: number;
}

type RowGroup = FormGroup<{
  name: FormControl<string>;
  type: FormControl<RowType>;
  value: FormControl<number>;
}>;

function rowAmount(row: PayrollRow, basic: number): number {
  if (!row || row.value == null) return 0;
  return row.type === 'percent' ? (row.value / 100) * basic : row.value;
}

// Sri Lanka PAYE monthly tax brackets (annual thresholds ÷ 12)
function calcIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  const brackets: [number, number][] = [
    [100_000, 0.00],
    [41_667,  0.06],
    [41_667,  0.12],
    [41_667,  0.18],
    [41_667,  0.24],
    [41_667,  0.30],
    [Infinity, 0.36],
  ];
  let tax = 0;
  let remaining = taxableIncome;
  for (const [limit, rate] of brackets) {
    if (remaining <= 0) break;
    const chunk = Math.min(remaining, limit);
    tax += chunk * rate;
    remaining -= chunk;
  }
  return tax;
}

function createRowGroup(fb: FormBuilder, name = '', type: RowType = 'fixed', value = 0): RowGroup {
  return fb.group({
    name:  fb.nonNullable.control(name, Validators.required),
    type:  fb.nonNullable.control<RowType>(type),
    value: fb.nonNullable.control(value, [Validators.required, Validators.min(0)]),
  }) as RowGroup;
}

@Component({
  selector: 'app-payroll-entry',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatDividerModule,
    MatStepperModule,
    PayrollPrepareComponent,
  ],
  templateUrl: './payroll-entry.html',
  styleUrl:    './payroll-entry.scss',
})
export class PayrollEntry {
  private readonly fb          = inject(FormBuilder);
  private readonly cdr         = inject(ChangeDetectorRef);
  private readonly prepareSvc  = inject(PayrollPrepareService);

  private readonly stepper = viewChild.required<MatStepper>('stepper');

  // ── Config ────────────────────────────────────────────────────────────────

  readonly employeeCols: TableColumn<EmployeeModel>[] = [
    { key: 'employeeNo', label: 'Emp #' },
    { key: 'firstName',  label: 'First Name' },
    { key: 'lastName',   label: 'Last Name' },
  ];

  readonly empDisplayFn = (item: EmployeeModel): string =>
    `${item.firstName} ${item.lastName} — ${item.employeeNo}`;

  // ── Step 1 – Prepare ─────────────────────────────────────────────────────

  readonly prepareForm = this.fb.group({
    employeeId: this.fb.control<number | null>(null, Validators.required),
    allowances: this.fb.array<RowGroup>([]),
    deductions: this.fb.array<RowGroup>([]),
  });

  // ── Step 5 – Approve ──────────────────────────────────────────────────────

  readonly approveForm = this.fb.group({
    approvedBy: this.fb.nonNullable.control('', Validators.required),
    remarks:    this.fb.nonNullable.control(''),
  });

  // ── Workflow state ────────────────────────────────────────────────────────

  readonly selectedEmployee  = signal<EmployeeModel | null>(null);
  readonly isReviewConfirmed = signal(false);
  readonly isApproved        = signal(false);
  readonly isDisbursed       = signal(false);

  constructor() {
    this.prepareForm.controls.employeeId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this._onEmployeeChange());
  }

  // ── Reactive values ───────────────────────────────────────────────────────

  private readonly rawCalcValue = toSignal(
    this.prepareForm.valueChanges.pipe(startWith(null), map(() => this.prepareForm.getRawValue())),
    { initialValue: this.prepareForm.getRawValue() },
  );

  get allowancesArray(): FormArray<RowGroup> { return this.prepareForm.controls.allowances; }
  get deductionsArray(): FormArray<RowGroup> { return this.prepareForm.controls.deductions; }

  onItemSelected(item: unknown): void {
    this.selectedEmployee.set(item as EmployeeModel);
  }

  // ── Computations ──────────────────────────────────────────────────────────

  readonly basicSalary = computed(() => 0); // TODO: fetch from emp_bsal table

  readonly allowanceRows = computed<PayrollRow[]>(
    () => this.rawCalcValue().allowances as PayrollRow[],
  );
  readonly deductionRows = computed<PayrollRow[]>(
    () => this.rawCalcValue().deductions as PayrollRow[],
  );

  readonly allowanceAmounts = computed(() => {
    const basic = this.basicSalary();
    return this.allowanceRows().map(r => ({ name: r.name, amount: rowAmount(r, basic) }));
  });

  readonly deductionAmounts = computed(() => {
    const basic = this.basicSalary();
    return this.deductionRows().map(r => ({ name: r.name, amount: rowAmount(r, basic) }));
  });

  readonly totalAllowances  = computed(() => this.allowanceAmounts().reduce((s, r) => s + r.amount, 0));
  readonly grossPay         = computed(() => this.basicSalary() + this.totalAllowances());
  readonly epfEmployee      = computed(() => Math.round(this.basicSalary() * 0.11 * 100) / 100);
  readonly otherDeductions  = computed(() => this.deductionAmounts().reduce((s, r) => s + r.amount, 0));
  readonly taxableIncome    = computed(() => Math.max(0, this.grossPay() - this.epfEmployee()));
  readonly incomeTax        = computed(() => Math.round(calcIncomeTax(this.taxableIncome()) * 100) / 100);
  readonly totalDeductions  = computed(() => this.epfEmployee() + this.incomeTax() + this.otherDeductions());
  readonly netPay           = computed(() => this.grossPay() - this.totalDeductions());
  readonly epfEmployer      = computed(() => Math.round(this.basicSalary() * 0.13 * 100) / 100);
  readonly etfEmployer      = computed(() => Math.round(this.basicSalary() * 0.03 * 100) / 100);
  readonly totalEmployerCost = computed(() => this.grossPay() + this.epfEmployer() + this.etfEmployer());

  readonly periodLabel = this.prepareSvc.periodLabel;

  // ── Private helpers ───────────────────────────────────────────────────────

  private _onEmployeeChange(): void {
    this.allowancesArray.clear({ emitEvent: false });
    this.deductionsArray.clear({ emitEvent: false });
    this.prepareForm.updateValueAndValidity();
    this.isReviewConfirmed.set(false);
    this.isApproved.set(false);
    this.isDisbursed.set(false);
  }

  // ── Calculate step ────────────────────────────────────────────────────────

  addAllowance(): void  { this.allowancesArray.push(createRowGroup(this.fb)); }
  removeAllowance(i: number): void { this.allowancesArray.removeAt(i); }
  addDeduction(): void  { this.deductionsArray.push(createRowGroup(this.fb)); }
  removeDeduction(i: number): void { this.deductionsArray.removeAt(i); }

  // ── Workflow transitions ──────────────────────────────────────────────────

  // detectChanges() is called before stepper.next() so that signal→[completed]
  // bindings are flushed to the MatStep before the linear-mode check runs.

  confirmReview(): void {
    this.isReviewConfirmed.set(true);
    this.cdr.detectChanges();
    this.stepper().next();
  }

  approvePayroll(): void {
    this.approveForm.markAllAsTouched();
    if (this.approveForm.invalid) return;
    this.isApproved.set(true);
    this.cdr.detectChanges();
    this.stepper().next();
  }

  disburse(): void {
    this.isDisbursed.set(true);
  }

  resetWorkflow(): void {
    const today = new Date();
    this.prepareSvc.periodMonth.set(today.getMonth() + 1);
    this.prepareSvc.periodYear.set(today.getFullYear());
    this.prepareForm.controls.employeeId.reset(null);
    this.approveForm.reset();
    this.selectedEmployee.set(null);
    this.isReviewConfirmed.set(false);
    this.isApproved.set(false);
    this.isDisbursed.set(false);
    this.stepper().reset();
  }
}
