import {
  ChangeDetectionStrategy, Component, DestroyRef,
  computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe, LowerCasePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { PayrollRunService } from '../shared/payroll-run.service';
import { PayrollRunResponse, PayrollRunSummary } from '../shared/payroll-run.model';
import { PayslipService } from './payslip.service';
import { PayslipTemplate, type PayslipLayout } from './payslip-template/payslip-template';
import { TableAutocomplete, type TableColumn } from '../../../shared/components/table-autocomplete/table-autocomplete';
import { type EmployeeResponse } from '../../settings/employee/employee.model';

// ── Constants ──────────────────────────────────────────────────────────────

const MONTHS = [
  { value: 1,  label: 'January'   },
  { value: 2,  label: 'February'  },
  { value: 3,  label: 'March'     },
  { value: 4,  label: 'April'     },
  { value: 5,  label: 'May'       },
  { value: 6,  label: 'June'      },
  { value: 7,  label: 'July'      },
  { value: 8,  label: 'August'    },
  { value: 9,  label: 'September' },
  { value: 10, label: 'October'   },
  { value: 11, label: 'November'  },
  { value: 12, label: 'December'  },
];

const TODAY = new Date();

// ── Component ──────────────────────────────────────────────────────────────

@Component({
  selector: 'app-pay-slip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    LowerCasePipe,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    PayslipTemplate,
    TableAutocomplete,
  ],
  templateUrl: './pay-slip.html',
  styleUrl: './pay-slip.scss',
})
export class PaySlip {
  private readonly fb         = inject(FormBuilder);
  private readonly runSvc     = inject(PayrollRunService);
  private readonly payslipSvc = inject(PayslipService);
  private readonly snackBar   = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  // ── Static data ──────────────────────────────────────────────────────

  readonly months = MONTHS;
  readonly years  = [TODAY.getFullYear() - 1, TODAY.getFullYear(), TODAY.getFullYear() + 1];

  // ── Employee autocomplete ─────────────────────────────────────────────

  readonly employeeCols: TableColumn<EmployeeResponse>[] = [
    { key: 'employeeNo', label: 'Emp #'      },
    { key: 'firstName',  label: 'First Name' },
    { key: 'lastName',   label: 'Last Name'  },
  ];
  readonly empDisplayFn = (e: EmployeeResponse) =>
    `${e.firstName} ${e.lastName} — ${e.employeeNo}`;

  // ── Forms ─────────────────────────────────────────────────────────────

  readonly periodForm = this.fb.group({
    month: this.fb.nonNullable.control(TODAY.getMonth() + 1, Validators.required),
    year:  this.fb.nonNullable.control(TODAY.getFullYear(),  Validators.required),
  });

  // ── State ─────────────────────────────────────────────────────────────

  readonly layout           = signal<PayslipLayout>('portrait');
  readonly batchRuns        = signal<PayrollRunSummary[]>([]);
  readonly detailRun        = signal<PayrollRunResponse | null>(null);
  readonly selectedEmployee = signal<EmployeeResponse | null>(null);
  readonly checkedIds       = signal<Set<number>>(new Set());
  readonly loading          = signal(false);
  readonly emailing         = signal(false);

  // ── Computed ──────────────────────────────────────────────────────────

  readonly payrollMonth = computed(() => {
    const { month, year } = this.periodForm.getRawValue();
    return `${year}-${String(month).padStart(2, '0')}`;
  });

  readonly periodLabel = computed(() => {
    const { month, year } = this.periodForm.getRawValue();
    return `${MONTHS.find(m => m.value === month)?.label ?? ''} ${year}`;
  });

  readonly allChecked = computed(() =>
    this.batchRuns().length > 0 &&
    this.batchRuns().every(r => this.checkedIds().has(r.id)),
  );

  readonly someChecked = computed(() =>
    this.batchRuns().some(r => this.checkedIds().has(r.id)) && !this.allChecked(),
  );

  readonly checkedCount = computed(() => this.checkedIds().size);

  // ── Handlers: period ─────────────────────────────────────────────────

  loadMonth(): void {
    if (this.periodForm.invalid) return;
    this.loading.set(true);
    this.batchRuns.set([]);
    this.detailRun.set(null);
    this.selectedEmployee.set(null);
    this.checkedIds.set(new Set());

    this.runSvc.getByMonth(this.payrollMonth())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  runs => { this.batchRuns.set(runs); this.loading.set(false); },
        error: ()   => {
          this.snackBar.open('Failed to load payroll runs.', 'Close', { duration: 4000 });
          this.loading.set(false);
        },
      });
  }

  // ── Handlers: individual employee selection ────────────────────────────

  onEmployeeSelected(item: unknown): void {
    const emp = item as EmployeeResponse;
    this.selectedEmployee.set(emp);
    this.detailRun.set(null);
    const existing = this.batchRuns().find(r => r.empId === emp.id);
    if (existing) {
      this.loadRunDetail(existing.id);
    }
  }

  // ── Handlers: checkboxes ──────────────────────────────────────────────

  toggleAll(checked: boolean): void {
    this.checkedIds.set(checked ? new Set(this.batchRuns().map(r => r.id)) : new Set());
  }

  toggleRow(id: number, checked: boolean): void {
    this.checkedIds.update(s => {
      const next = new Set(s);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  isChecked(id: number): boolean {
    return this.checkedIds().has(id);
  }

  // ── Handlers: view ────────────────────────────────────────────────────

  viewRun(run: PayrollRunSummary): void {
    this.loadRunDetail(run.id);
  }

  loadRunDetail(runId: number): void {
    this.loading.set(true);
    this.runSvc.getById(runId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  run  => { this.detailRun.set(run); this.loading.set(false); },
        error: ()   => {
          this.snackBar.open('Failed to load run detail.', 'Close', { duration: 4000 });
          this.loading.set(false);
        },
      });
  }

  printSlip(): void {
    window.print();
  }

  // ── Handlers: email ───────────────────────────────────────────────────

  emailSelected(): void {
    const ids = [...this.checkedIds()];
    if (!ids.length) {
      this.snackBar.open('Select at least one employee to email.', 'Close', { duration: 3000 });
      return;
    }
    this.emailing.set(true);
    this.payslipSvc.emailPayslips({ runIds: ids, layout: this.layout() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.emailing.set(false);
          const msg = `Sent ${result.sent} payslip(s).${result.failed ? ' ' + result.failed + ' failed.' : ''}`;
          this.snackBar.open(msg, 'Close', { duration: 5000 });
        },
        error: () => {
          this.emailing.set(false);
          this.snackBar.open('Email dispatch failed.', 'Close', { duration: 4000 });
        },
      });
  }
}
