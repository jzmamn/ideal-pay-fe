import {
  ChangeDetectionStrategy, Component, DestroyRef,
  computed, effect, inject, signal, untracked, OnInit,
} from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, lastValueFrom, takeUntil } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { IndividualSalaryService } from './individual-salary/shared/individual-salary.service';
import { BatchService } from '../batch/batch.service';
import { EmployeeProfileService } from '../../settings/employee/employee-profile.service';
import { PayrollRunService } from '../shared/payroll-run.service';
import { PayrollRunResponse } from '../shared/payroll-run.model';
import { PayrollDraftViewComponent } from '../shared/payroll-draft-view/payroll-draft-view';
import { TableAutocomplete, type TableColumn } from '../../../shared/components/table-autocomplete/table-autocomplete';
import { type EmployeeResponse } from '../../settings/employee/employee.model';
import type {
  EmployeePayrollComponentsResponse,
  EmployeeProfileSaveRequest,
  EmployeeFixedAllowanceResponse,
  EmployeeFixedDeductionResponse,
  EmployeeVariableAllowanceResponse,
  EmployeeVariableDeductionResponse,
  EmployeeNopayResponse,
  EmployeeOvertimeResponse,
  EmployeeLateResponse,
  EmployeeLateRequest,
} from '../../settings/employee/employee-profile.model';
import type {
  EmployeeFixedAllowanceRequest,
} from '../../settings/employee/employee-fixed-allowance/employee-fixed-allowance.model';
import type {
  EmployeeFixedDeductionRequest,
} from '../../settings/employee/employee-fixed-deduction/employee-fixed-deduction.model';

type WorkflowStep = 'prepare' | 'draft' | 'review' | 'approve' | 'disburse';

export const SUB_STEPS = [
  { uiKey: 'fixedAlw',  label: 'Fixed Allowance'    },
  { uiKey: 'varAlw',    label: 'Variable Allowance'  },
  { uiKey: 'overtime',  label: 'Overtime'            },
  { uiKey: 'fixedDed',  label: 'Fixed Deduction'     },
  { uiKey: 'varDed',    label: 'Variable Deduction'  },
  { uiKey: 'nopay',     label: 'NoPay'               },
  { uiKey: 'late',      label: 'Late Deduction'      },
  { uiKey: 'loans',     label: 'Loans'               },
] as const;

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
    MatIconModule, MatInputModule, MatProgressSpinnerModule,
    MatSelectModule, MatTabsModule,
    TableAutocomplete,
    PayrollDraftViewComponent,
  ],
  templateUrl: './individual.html',
  styleUrl: './individual.scss',
})
export class IndividualComponent implements OnInit {
  readonly svc             = inject(IndividualSalaryService);
  private readonly profileSvc  = inject(EmployeeProfileService);
  private readonly batchSvc    = inject(BatchService);
  private readonly payrollRunSvc = inject(PayrollRunService);
  private readonly destroyRef  = inject(DestroyRef);
  private readonly fb          = inject(FormBuilder);

  readonly SUB_STEPS       = SUB_STEPS;

  readonly employeeCtrl     = new FormControl<number | null>(null);
  readonly selectedEmployee = signal<EmployeeResponse | null>(null);
  readonly employeeProfile  = signal<EmployeePayrollComponentsResponse | null>(null);
  readonly sidebarProfile   = signal<EmployeePayrollComponentsResponse | null>(null);
  readonly profileLoading   = signal(false);
  readonly selectedSubStep  = signal(0);
  readonly workflowStep     = signal<WorkflowStep>('prepare');
  readonly lates            = signal<EmployeeLateResponse[]>([]);
  private readonly latesLoad$ = new Subject<void>();
  readonly saving              = signal(false);
  readonly submitting          = signal(false);
  readonly loadingComponents   = signal(false);
  readonly loadComponentsInfo  = signal<string | null>(null);
  readonly loadComponentsError = signal<string | null>(null);
  readonly isDisbursed      = signal(false);
  readonly lastSavedAt      = signal<Date | null>(null);
  readonly draftRun         = signal<PayrollRunResponse | null>(null);

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

  readonly employeeCols: TableColumn<EmployeeResponse>[] = [
    { key: 'employeeNo', label: 'Emp #'      },
    { key: 'firstName',  label: 'First Name' },
    { key: 'lastName',   label: 'Last Name'  },
  ];

  readonly empDisplayFn = (item: EmployeeResponse): string =>
    `${item.firstName} ${item.lastName} — ${item.employeeNo}`;

  // ── Profile-derived signals ────────────────────────────────────────────────

  readonly sidebarEmployee    = computed(() => this.sidebarProfile()?.employee ?? this.selectedEmployee());

  // ── Sidebar pay-summary totals (from assignedOnly=true profile) ───────────

  readonly sidebarTotalFA  = computed(() =>
    (this.sidebarProfile()?.fixedAllowances    ?? []).reduce((s, r) => s + (r.amount ?? 0), 0));
  readonly sidebarTotalVA  = computed(() =>
    (this.sidebarProfile()?.variableAllowances ?? []).reduce((s, r) => s + (r.amount ?? 0), 0));
  readonly sidebarTotalOT  = computed(() =>
    (this.sidebarProfile()?.overtimes          ?? []).reduce((s, r) => s + (r.amount ?? 0), 0));
  readonly sidebarTotalFD  = computed(() =>
    (this.sidebarProfile()?.fixedDeductions    ?? []).reduce((s, r) => s + (r.amount ?? 0), 0));
  readonly sidebarTotalVD  = computed(() =>
    (this.sidebarProfile()?.variableDeductions ?? []).reduce((s, r) => s + (r.amount ?? 0), 0));
  readonly sidebarTotalNP   = computed(() =>
    (this.sidebarProfile()?.nopays             ?? []).reduce((s, r) => s + (r.amount ?? 0), 0));
  readonly sidebarTotalLate = computed(() =>
    this.lates().reduce((s, r) => s + (r.amount ?? 0), 0));
  readonly sidebarGross    = computed(() =>
    (this.sidebarEmployee()?.basicSalary ?? 0) + this.sidebarTotalFA() + this.sidebarTotalVA() + this.sidebarTotalOT());
  readonly sidebarDedTotal = computed(() =>
    this.sidebarTotalFD() + this.sidebarTotalVD() + this.sidebarTotalNP() + this.sidebarTotalLate());
  readonly sidebarNet      = computed(() => this.sidebarGross() - this.sidebarDedTotal());

  // ── Sidebar breakdown lists — zero-amount rows excluded ───────────────────

  readonly sidebarFAItems = computed(() =>
    (this.sidebarProfile()?.fixedAllowances    ?? []).filter(r => (r.amount ?? 0) > 0));
  readonly sidebarVAItems = computed(() =>
    (this.sidebarProfile()?.variableAllowances ?? []).filter(r => (r.amount ?? 0) > 0));
  readonly sidebarOTItems = computed(() =>
    (this.sidebarProfile()?.overtimes          ?? []).filter(r => (r.amount ?? 0) > 0 || (r.hours ?? 0) > 0));
  readonly sidebarFDItems = computed(() =>
    (this.sidebarProfile()?.fixedDeductions    ?? []).filter(r => (r.amount ?? 0) > 0));
  readonly sidebarVDItems = computed(() =>
    (this.sidebarProfile()?.variableDeductions ?? []).filter(r => (r.amount ?? 0) > 0));
  readonly sidebarNPItems = computed(() =>
    (this.sidebarProfile()?.nopays             ?? []).filter(r => (r.amount ?? 0) > 0 || (r.days ?? 0) > 0));

  /** Fallback rate when no server load has been performed yet. */
  private readonly lateHourlyRateFallback = computed(() =>
    (this.selectedEmployee()?.basicSalary ?? 0) / (26 * 8));
  /** Displayed rate: prefers the server-stored rate from the loaded record. */
  readonly lateHourlyRate = computed(() =>
    this.lates()[0]?.rate ?? this.lateHourlyRateFallback());

  readonly fixedAllowances    = computed(() => this.employeeProfile()?.fixedAllowances    ?? []);
  readonly fixedDeductions    = computed(() => this.employeeProfile()?.fixedDeductions    ?? []);
  readonly variableAllowances = computed(() => this.employeeProfile()?.variableAllowances ?? []);
  readonly variableDeductions = computed(() => this.employeeProfile()?.variableDeductions ?? []);
  readonly overtimes          = computed(() => this.employeeProfile()?.overtimes          ?? []);

  /** Only the nopay type configured on the employee master record */
  readonly nopays = computed(() => {
    const all    = this.employeeProfile()?.nopays ?? [];
    const typeId = this.selectedEmployee()?.nopayDaysId;
    return typeId != null ? all.filter(n => n.nopayId === typeId) : all;
  });

  // ── Salary computations ────────────────────────────────────────────────────

  readonly basicSalary = computed(() => this.selectedEmployee()?.basicSalary ?? 0);

  private readonly selectedEntry = computed(() => {
    const emp = this.selectedEmployee();
    if (!emp) return null;
    return this.svc.entries().find(e => e.employeeId === emp.id) ?? null;
  });

  readonly grossPay          = computed(() => this.selectedEntry()?.grossPay ?? this.basicSalary());
  readonly epfEmployee       = computed(() => Math.round(this.basicSalary() * 0.11 * 100) / 100);
  readonly taxableIncome     = computed(() => Math.max(0, this.grossPay() - this.epfEmployee()));
  readonly incomeTax         = computed(() => Math.round(calcIncomeTax(this.taxableIncome()) * 100) / 100);
  readonly totalDeductions   = computed(() =>
    this.selectedEntry()?.totalDeductions ?? (this.epfEmployee() + this.incomeTax()));
  readonly netPay            = computed(() =>
    this.selectedEntry()?.netPay ?? (this.grossPay() - this.totalDeductions()));
  readonly epfEmployer       = computed(() => Math.round(this.basicSalary() * 0.13 * 100) / 100);
  readonly etfEmployer       = computed(() => Math.round(this.basicSalary() * 0.03 * 100) / 100);
  readonly totalEmployerCost = computed(() => this.grossPay() + this.epfEmployer() + this.etfEmployer());

  readonly periodLabel = this.svc.periodLabel;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  constructor() {
    // Reload profile when period changes while an employee is already selected
    effect(() => {
      this.svc.periodMonth();
      this.svc.periodYear();
      const emp = untracked(() => this.selectedEmployee());
      if (emp) {
        this.employeeProfile.set(null);
        this.sidebarProfile.set(null);
        this.lates.set([]);
        this.workflowStep.set('prepare');
        this.loadProfile(emp.id);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.svc.loadEntries();
  }

  // ── Event handlers ─────────────────────────────────────────────────────────

  onEmployeeSelected(item: unknown): void {
    const emp = item as EmployeeResponse;
    this.selectedEmployee.set(emp);
    this.employeeProfile.set(null);
    this.sidebarProfile.set(null);
    this.lates.set([]);
    this.workflowStep.set('prepare');
    this.selectedSubStep.set(0);
    this.loadProfile(emp.id);
  }

  // ── Profile fetch ──────────────────────────────────────────────────────────

  private loadProfile(empId: number): void {
    this.profileLoading.set(true);

    const month = this.svc.periodMonth().toString().padStart(2, '0');
    const payrollMonth = `${this.svc.periodYear()}-${month}`;

    this.profileSvc.getEmployeeProfileByEmployee(empId, false, payrollMonth)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  profile => { this.employeeProfile.set(profile); this.profileLoading.set(false); },
        error: ()      => this.profileLoading.set(false),
      });

    this.profileSvc.getEmployeeProfileByEmployee(empId, true, payrollMonth)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  profile => this.sidebarProfile.set(profile),
        error: ()      => { /* sidebar falls back to selectedEmployee() */ },
      });

    // Load late deduction for current period — cancel any in-flight request from a prior employee selection
    this.latesLoad$.next();
    this.profileSvc.getLatesByEmployee(empId)
      .pipe(takeUntil(this.latesLoad$), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: entries => {
          const periodEntry = entries.find(e => e.payrollMonth === payrollMonth);
          if (periodEntry) {
            this.lates.set([periodEntry]);
          } else {
            // Seed a blank row so the UI always has one editable row
            this.lates.set([{
              id: 0, hours: 0, amount: 0, payrollMonth,
              isProcessed: false, empId, empCode: '', empName: '',
            }]);
          }
        },
        error: () => this.lates.set([]),
      });
  }

  // ── Load components ────────────────────────────────────────────────────────

  /**
   * Calls the server-side load endpoint for the selected employee.
   * Evaluates formulas, stores FA/FD amounts and OT/NoPay/Late rates,
   * then refreshes the profile so the UI shows the server-computed values.
   */
  async loadComponents(): Promise<void> {
    const emp = this.selectedEmployee();
    if (!emp) return;
    this.loadingComponents.set(true);
    this.loadComponentsInfo.set(null);
    this.loadComponentsError.set(null);
    try {
      const summary = await lastValueFrom(
        this.batchSvc.loadComponentsForEmployee(
          emp.id,
          this.svc.periodMonth(),
          this.svc.periodYear(),
          1, // TODO: replace with authenticated user id
        ),
      );
      const msg = `Loaded: ${summary.recordsUpserted} record(s) updated.` +
        (summary.errors?.length ? ` Warnings: ${summary.errors.join('; ')}` : '');
      this.loadComponentsInfo.set(msg);
      // Refresh the profile so FA/FD amounts and OT/NoPay/Late rates are shown
      this.loadProfile(emp.id);
    } catch {
      this.loadComponentsError.set('Failed to load components. Please try again.');
    } finally {
      this.loadingComponents.set(false);
    }
  }

  // ── Row update helpers ─────────────────────────────────────────────────────

  updateFixedAllowance(idx: number, changes: Partial<EmployeeFixedAllowanceResponse>): void {
    this.employeeProfile.update(p => {
      if (!p) return p;
      const list = [...p.fixedAllowances];
      list[idx] = { ...list[idx], ...changes };
      return { ...p, fixedAllowances: list };
    });
  }

  updateFixedDeduction(idx: number, changes: Partial<EmployeeFixedDeductionResponse>): void {
    this.employeeProfile.update(p => {
      if (!p) return p;
      const list = [...p.fixedDeductions];
      list[idx] = { ...list[idx], ...changes };
      return { ...p, fixedDeductions: list };
    });
  }

  updateVariableAllowance(idx: number, changes: Partial<EmployeeVariableAllowanceResponse>): void {
    this.employeeProfile.update(p => {
      if (!p) return p;
      const list = [...p.variableAllowances];
      list[idx] = { ...list[idx], ...changes };
      return { ...p, variableAllowances: list };
    });
  }

  updateVariableDeduction(idx: number, changes: Partial<EmployeeVariableDeductionResponse>): void {
    this.employeeProfile.update(p => {
      if (!p) return p;
      const list = [...p.variableDeductions];
      list[idx] = { ...list[idx], ...changes };
      return { ...p, variableDeductions: list };
    });
  }

  updateOvertime(idx: number, changes: Partial<EmployeeOvertimeResponse>): void {
    this.employeeProfile.update(p => {
      if (!p) return p;
      const list = [...p.overtimes];
      const current = list[idx];
      const updated = { ...current, ...changes };
      // Auto-compute amount when hours change and a server rate is available
      if ('hours' in changes && current.rate != null) {
        updated.amount = Math.round(current.rate * (changes.hours ?? 0) * 100) / 100;
      }
      list[idx] = updated;
      return { ...p, overtimes: list };
    });
  }

  updateNopay(idx: number, changes: Partial<EmployeeNopayResponse>): void {
    this.employeeProfile.update(p => {
      if (!p) return p;
      const list = [...p.nopays];
      const current = list[idx];
      const updated = { ...current, ...changes };
      // Auto-compute amount when days change and a server rate is available
      if ('days' in changes && current.rate != null) {
        updated.amount = Math.round(current.rate * (changes.days ?? 0) * 100) / 100;
      }
      list[idx] = updated;
      return { ...p, nopays: list };
    });
  }

  updateLate(idx: number, changes: Partial<EmployeeLateResponse>): void {
    this.lates.update(list => {
      const next = [...list];
      const current = next[idx];
      const updated = { ...current, ...changes };
      if ('hours' in changes) {
        const rate = current.rate ?? this.lateHourlyRateFallback();
        updated.amount = Math.round(rate * (changes.hours ?? 0) * 100) / 100;
      }
      next[idx] = updated;
      return next;
    });
  }

  // ── Save payload builder ───────────────────────────────────────────────────

  /**
   * Builds the save request from the current profile signal.
   * Only payroll component records are included — the employee master
   * record is never touched here (basic salary is updated separately
   * via salary increment only).
   */
  private buildSavePayload(empId: number): EmployeeProfileSaveRequest {
    const p = this.employeeProfile()!;
    const month = this.svc.periodMonth().toString().padStart(2, '0');
    const payrollMonth = `${this.svc.periodYear()}-${month}`;
    const MODIFIED_BY = 1; // TODO: replace with auth user id

    const fixedAllowances: EmployeeFixedAllowanceRequest[] = p.fixedAllowances.map(r => ({
      id:            r.id,
      empId,
      faId:          r.faId,
      amount:        r.amount ?? 0,
      payrollMonth:  r.payrollMonth ?? payrollMonth,
      isProcessed:   r.isProcessed,
      processedDate: r.processedDate,
      createdBy:     MODIFIED_BY,
      modifiedBy:    MODIFIED_BY,
    }));

    const fixedDeductions: EmployeeFixedDeductionRequest[] = p.fixedDeductions.map(r => ({
      id:            r.id,
      empId,
      fdId:          r.fdId,
      amount:        r.amount ?? 0,
      payrollMonth:  r.payrollMonth ?? payrollMonth,
      isProcessed:   r.isProcessed,
      processedDate: r.processedDate,
      createdBy:     MODIFIED_BY,
      modifiedBy:    MODIFIED_BY,
    }));

    const variableAllowances = p.variableAllowances.map(r => ({
      id:            r.id,
      empId,
      vaId:          r.vaId,
      amount:        r.amount ?? 0,
      payrollMonth:  r.payrollMonth ?? payrollMonth,
      isProcessed:   r.isProcessed,
      processedDate: r.processedDate,
      createdBy:     MODIFIED_BY,
      modifiedBy:    MODIFIED_BY,
    }));

    const variableDeductions = p.variableDeductions.map(r => ({
      id:            r.id,
      empId,
      vdId:          r.vdId,
      amount:        r.amount ?? 0,
      payrollMonth:  r.payrollMonth ?? payrollMonth,
      isProcessed:   r.isProcessed,
      processedDate: r.processedDate,
      createdBy:     MODIFIED_BY,
      modifiedBy:    MODIFIED_BY,
    }));

    const nopays = p.nopays.map(r => ({
      id:            r.id,
      empId,
      nopayId:       r.nopayId,
      days:          r.days   ?? 0,
      amount:        r.amount ?? 0,
      payrollMonth:  r.payrollMonth ?? payrollMonth,
      isProcessed:   r.isProcessed,
      processedDate: r.processedDate,
      createdBy:     MODIFIED_BY,
      modifiedBy:    MODIFIED_BY,
    }));

    const overtimes = p.overtimes.map(r => ({
      id:            r.id,
      empId,
      overtimeId:    r.overtimeId,
      hours:         r.hours  ?? 0,
      amount:        r.amount ?? 0,
      payrollMonth:  r.payrollMonth ?? payrollMonth,
      isProcessed:   r.isProcessed,
      processedDate: r.processedDate,
      createdBy:     MODIFIED_BY,
      modifiedBy:    MODIFIED_BY,
    }));

    return { fixedAllowances, fixedDeductions, variableAllowances, variableDeductions, nopays, overtimes };
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async saveDraft(): Promise<void> {
    const emp = this.selectedEmployee();
    if (!emp || !this.employeeProfile()) return;
    this.saving.set(true);
    try {
      const month = this.svc.periodMonth().toString().padStart(2, '0');
      const payrollMonth = `${this.svc.periodYear()}-${month}`;
      const MODIFIED_BY = 1; // TODO: replace with auth user id

      // Save main profile components
      const payload = this.buildSavePayload(emp.id);
      const saved = await lastValueFrom(
        this.profileSvc.saveEmployeeProfile(emp.id, payload)
      );
      this.employeeProfile.set(saved);

      // Save late deduction (upsert by empId + payrollMonth on backend)
      const savedLates: EmployeeLateResponse[] = [];
      for (const late of this.lates()) {
        if (late.hours > 0) {
          const lateReq: EmployeeLateRequest = {
            ...(late.id > 0 ? { id: late.id } : {}),
            empId:        emp.id,
            hours:        late.hours,
            amount:       late.amount,
            payrollMonth,
            isProcessed:  late.isProcessed,
            createdBy:    MODIFIED_BY,
            modifiedBy:   MODIFIED_BY,
          };
          savedLates.push(await lastValueFrom(this.profileSvc.saveLate(lateReq)));
        } else if (late.id > 0) {
          await lastValueFrom(this.profileSvc.deleteLate(late.id));
          savedLates.push({ ...late, id: 0, hours: 0, amount: 0 });
        }
      }
      if (savedLates.length) this.lates.set(savedLates);

      this.lastSavedAt.set(new Date());
    } finally {
      this.saving.set(false);
    }
  }

  async recalculate(): Promise<void> {
    await this.svc.recalculate();
  }

  async submitForReview(): Promise<void> {
    const emp = this.selectedEmployee();
    if (!emp) return;
    this.submitting.set(true);
    try {
      // 1. Save component entries first
      await this.saveDraft();

      // 2. Call the payroll run engine
      const month = this.svc.periodMonth().toString().padStart(2, '0');
      const payrollMonth = `${this.svc.periodYear()}-${month}`;
      const run = await lastValueFrom(
        this.payrollRunSvc.processIndividual(emp.id, payrollMonth, 1) // TODO: real userId
      );

      // 3. Show the draft view
      this.draftRun.set(run);
      this.workflowStep.set('draft');
    } finally {
      this.submitting.set(false);
    }
  }

  /** Called from draft view when user clicks Re-process. */
  async reprocessIndividual(): Promise<void> {
    const emp = this.selectedEmployee();
    if (!emp) return;
    this.submitting.set(true);
    try {
      const month = this.svc.periodMonth().toString().padStart(2, '0');
      const payrollMonth = `${this.svc.periodYear()}-${month}`;
      const run = await lastValueFrom(
        this.payrollRunSvc.processIndividual(emp.id, payrollMonth, 1)
      );
      this.draftRun.set(run);
    } finally {
      this.submitting.set(false);
    }
  }

  /** Called when draft view emits locked event. */
  onRunLocked(run: PayrollRunResponse): void {
    this.draftRun.set(run);
  }

  confirmReview(): void { this.workflowStep.set('approve'); }

  approvePayroll(): void {
    this.approveForm.markAllAsTouched();
    if (this.approveForm.invalid) return;
    this.workflowStep.set('disburse');
  }

  disburse(): void { this.isDisbursed.set(true); }

  resetWorkflow(): void {
    this.workflowStep.set('prepare');
    this.isDisbursed.set(false);
    this.approveForm.reset();
    this.employeeCtrl.reset();
    this.selectedEmployee.set(null);
    this.employeeProfile.set(null);
    this.selectedSubStep.set(0);
  }
}
