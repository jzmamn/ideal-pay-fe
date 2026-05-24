import {
  ChangeDetectionStrategy, Component, DestroyRef,
  computed, inject, signal, OnInit,
} from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { IndividualSalaryService } from './individual-salary/shared/individual-salary.service';
import { EmployeeSalaryService } from '../../settings/employee/employee-salary.service';
import { EarningsTabsComponent } from './individual-salary/earnings/earnings-tabs.component';
import { DeductionsTabsComponent } from './individual-salary/deductions/deductions-tabs.component';
import { TableAutocomplete, type TableColumn } from '../../../shared/components/table-autocomplete/table-autocomplete';
import { type EmployeeModel } from '../../settings/employee/employee.model';

type WorkflowStep = 'prepare' | 'review' | 'approve' | 'disburse';

// Sri Lanka PAYE monthly tax brackets (annual thresholds ÷ 12)
function calcIncomeTax(taxableIncome: number): number {
  if (taxableIncome <= 0) return 0;
  const brackets: [number, number][] = [
    [100_000, 0.00], [41_667, 0.06], [41_667, 0.12], [41_667, 0.18],
    [41_667, 0.24],  [41_667, 0.30], [Infinity, 0.36],
  ];
  let tax = 0;
  let remaining = taxableIncome;
  for (const [limit, rate] of brackets) {
    if (remaining <= 0) break;
    tax += Math.min(remaining, limit) * rate;
    remaining -= limit;
  }
  return tax;
}

@Component({
  selector: 'app-individual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, DatePipe, ReactiveFormsModule,
    MatButtonModule, MatDividerModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatSelectModule, MatTabsModule,
    TableAutocomplete, EarningsTabsComponent, DeductionsTabsComponent,
  ],
  templateUrl: './individual.html',
  styleUrl: './individual.scss',
})
export class IndividualComponent implements OnInit {
  readonly svc              = inject(IndividualSalaryService);
  private readonly salarySvc   = inject(EmployeeSalaryService);
  private readonly destroyRef  = inject(DestroyRef);
  private readonly fb          = inject(FormBuilder);

  readonly employeeCtrl     = new FormControl<number | null>(null);
  readonly selectedEmployee = signal<EmployeeModel | null>(null);
  readonly workflowStep     = signal<WorkflowStep>('prepare');
  readonly saving           = signal(false);
  readonly submitting       = signal(false);
  readonly isDisbursed      = signal(false);
  readonly lastSavedAt      = signal<Date | null>(null);

  readonly lastSavedLabel = computed(() => {
    const d = this.lastSavedAt();
    if (!d) return '';
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    return `Saved at ${hh}:${mm}`;
  });

  readonly approveForm = this.fb.group({
    approvedBy: this.fb.nonNullable.control('', Validators.required),
    remarks:    this.fb.nonNullable.control(''),
  });

  readonly employeeCols: TableColumn<EmployeeModel>[] = [
    { key: 'employeeNo', label: 'Emp #' },
    { key: 'firstName',  label: 'First Name' },
    { key: 'lastName',   label: 'Last Name' },
  ];

  readonly empDisplayFn = (item: EmployeeModel): string =>
    `${item.firstName} ${item.lastName} — ${item.employeeNo}`;

  // ── Salary computations ────────────────────────────────────────────────────

  readonly employeeSalary = computed(() => {
    const emp = this.selectedEmployee();
    return emp ? this.salarySvc.getByEmployeeId(emp.id) : null;
  });

  readonly basicSalary = computed(() => this.selectedEmployee()?.basicSalary ?? 0);

  private readonly selectedEntry = computed(() => {
    const emp = this.selectedEmployee();
    if (!emp) return null;
    return this.svc.entries().find(e => e.employeeId === emp.id) ?? null;
  });

  readonly grossPay         = computed(() => this.selectedEntry()?.grossPay ?? this.basicSalary());
  readonly epfEmployee      = computed(() => Math.round(this.basicSalary() * 0.11 * 100) / 100);
  readonly taxableIncome    = computed(() => Math.max(0, this.grossPay() - this.epfEmployee()));
  readonly incomeTax        = computed(() => Math.round(calcIncomeTax(this.taxableIncome()) * 100) / 100);
  readonly totalDeductions  = computed(() =>
    this.selectedEntry()?.totalDeductions ?? (this.epfEmployee() + this.incomeTax()));
  readonly netPay           = computed(() =>
    this.selectedEntry()?.netPay ?? (this.grossPay() - this.totalDeductions()));
  readonly epfEmployer      = computed(() => Math.round(this.basicSalary() * 0.13 * 100) / 100);
  readonly etfEmployer      = computed(() => Math.round(this.basicSalary() * 0.03 * 100) / 100);
  readonly totalEmployerCost = computed(() => this.grossPay() + this.epfEmployer() + this.etfEmployer());

  readonly periodLabel = this.svc.periodLabel;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.svc.loadEntries();

    const id = setInterval(async () => {
      if (this.svc.dirtyCount() > 0) {
        try {
          await this.svc.saveAll();
          this.lastSavedAt.set(new Date());
        } catch { /* already toasted by service */ }
      }
    }, 60_000);

    this.destroyRef.onDestroy(() => clearInterval(id));
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  onEmployeeSelected(item: unknown): void {
    this.selectedEmployee.set(item as EmployeeModel);
    this.workflowStep.set('prepare');
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async saveDraft(): Promise<void> {
    this.saving.set(true);
    try {
      await this.svc.saveAll();
      this.lastSavedAt.set(new Date());
    } finally {
      this.saving.set(false);
    }
  }

  async recalculate(): Promise<void> {
    await this.svc.recalculate();
  }

  async submitForReview(): Promise<void> {
    this.submitting.set(true);
    try {
      if (this.svc.dirtyCount() > 0) await this.saveDraft();
      this.workflowStep.set('review');
    } finally {
      this.submitting.set(false);
    }
  }

  confirmReview(): void {
    this.workflowStep.set('approve');
  }

  approvePayroll(): void {
    this.approveForm.markAllAsTouched();
    if (this.approveForm.invalid) return;
    this.workflowStep.set('disburse');
  }

  disburse(): void {
    this.isDisbursed.set(true);
  }

  resetWorkflow(): void {
    this.workflowStep.set('prepare');
    this.isDisbursed.set(false);
    this.approveForm.reset();
    this.employeeCtrl.reset();
    this.selectedEmployee.set(null);
  }
}
