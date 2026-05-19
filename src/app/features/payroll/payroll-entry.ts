import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { signal } from '@angular/core';
import { EmployeeService } from '../settings/employee/employee.service';

type RowType = 'fixed' | 'percent';

interface PayrollRow {
  name: string;
  type: RowType;
  value: number;
}

interface SavedState {
  employeeId: number | null;
  allowances: PayrollRow[];
  deductions: PayrollRow[];
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
    [100_000, 0],
    [41_667, 0.06],
    [41_667, 0.12],
    [41_667, 0.18],
    [41_667, 0.24],
    [41_667, 0.30],
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
    name: fb.nonNullable.control(name, Validators.required),
    type: fb.nonNullable.control<RowType>(type),
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
    MatSelectModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './payroll-entry.html',
  styleUrl: './payroll-entry.scss',
})
export class PayrollEntry {
  private readonly fb = inject(FormBuilder);
  private readonly empService = inject(EmployeeService);

  readonly employees = this.empService.employees;

  readonly form = this.fb.group({
    employeeId: this.fb.control<number | null>(null),
    allowances: this.fb.array<RowGroup>([]),
    deductions: this.fb.array<RowGroup>([]),
  });

  private readonly rawValue = toSignal(
    this.form.valueChanges.pipe(
      startWith(null),
      map(() => this.form.getRawValue()),
    ),
    { initialValue: this.form.getRawValue() },
  );

  private readonly savedState = signal<SavedState | null>(null);

  get allowancesArray(): FormArray<RowGroup> {
    return this.form.controls.allowances;
  }

  get deductionsArray(): FormArray<RowGroup> {
    return this.form.controls.deductions;
  }

  readonly selectedEmployee = computed(() => {
    const id = this.rawValue().employeeId;
    return this.employees().find(e => e.id === id);
  });

  readonly basicSalary = computed(() => 0); // TODO: fetch from emp_bsal table

  readonly allowanceRows = computed<PayrollRow[]>(() => this.rawValue().allowances as PayrollRow[]);
  readonly deductionRows = computed<PayrollRow[]>(() => this.rawValue().deductions as PayrollRow[]);

  readonly allowanceAmounts = computed(() => {
    const basic = this.basicSalary();
    return this.allowanceRows().map(r => ({ name: r.name, amount: rowAmount(r, basic) }));
  });

  readonly deductionAmounts = computed(() => {
    const basic = this.basicSalary();
    return this.deductionRows().map(r => ({ name: r.name, amount: rowAmount(r, basic) }));
  });

  readonly totalAllowances = computed(() =>
    this.allowanceAmounts().reduce((s, r) => s + r.amount, 0),
  );

  readonly grossPay = computed(() => this.basicSalary() + this.totalAllowances());

  readonly epfEmployee = computed(() => Math.round(this.basicSalary() * 0.11 * 100) / 100);

  readonly otherDeductions = computed(() =>
    this.deductionAmounts().reduce((s, r) => s + r.amount, 0),
  );

  readonly taxableIncome = computed(() =>
    Math.max(0, this.grossPay() - this.epfEmployee()),
  );

  readonly incomeTax = computed(() => Math.round(calcIncomeTax(this.taxableIncome()) * 100) / 100);

  readonly netPay = computed(() =>
    this.grossPay() - this.epfEmployee() - this.incomeTax() - this.otherDeductions(),
  );

  readonly epfEmployer = computed(() => Math.round(this.basicSalary() * 0.13 * 100) / 100);
  readonly etfEmployer = computed(() => Math.round(this.basicSalary() * 0.03 * 100) / 100);
  readonly totalEmployerCost = computed(() =>
    this.grossPay() + this.epfEmployer() + this.etfEmployer(),
  );

  onEmployeeChange(id: number): void {
    const emp = this.employees().find(e => e.id === id);
    if (!emp) return;

    this.allowancesArray.clear({ emitEvent: false });
    this.deductionsArray.clear({ emitEvent: false });
    this.form.updateValueAndValidity();

    this.savedState.set(this.captureState());
  }

  addAllowance(): void {
    this.allowancesArray.push(createRowGroup(this.fb));
  }

  removeAllowance(i: number): void {
    this.allowancesArray.removeAt(i);
  }

  addDeduction(): void {
    this.deductionsArray.push(createRowGroup(this.fb));
  }

  removeDeduction(i: number): void {
    this.deductionsArray.removeAt(i);
  }

  saveEntry(): void {
    this.savedState.set(this.captureState());
  }

  discardChanges(): void {
    const saved = this.savedState();
    if (!saved) return;
    this.restoreState(saved);
  }

  private captureState(): SavedState {
    const raw = this.form.getRawValue();
    return {
      employeeId: raw.employeeId,
      allowances: (raw.allowances as PayrollRow[]).map(r => ({ ...r })),
      deductions: (raw.deductions as PayrollRow[]).map(r => ({ ...r })),
    };
  }

  private restoreState(state: SavedState): void {
    this.allowancesArray.clear({ emitEvent: false });
    state.allowances.forEach(r =>
      this.allowancesArray.push(createRowGroup(this.fb, r.name, r.type, r.value), { emitEvent: false }),
    );

    this.deductionsArray.clear({ emitEvent: false });
    state.deductions.forEach(r =>
      this.deductionsArray.push(createRowGroup(this.fb, r.name, r.type, r.value), { emitEvent: false }),
    );

    this.form.updateValueAndValidity();
  }
}
