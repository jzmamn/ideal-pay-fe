import {
  ChangeDetectionStrategy, Component, DestroyRef,
  computed, inject, signal, OnInit,
} from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { PayrollPrepareService } from './shared/payroll-prepare.service';
import { EarningsTabsComponent } from './earnings/earnings-tabs.component';
import { DeductionsTabsComponent } from './deductions/deductions-tabs.component';
import { ToastService } from './shared/toast.service';
import { TableAutocomplete, type TableColumn } from '../../../shared/components/table-autocomplete/table-autocomplete';
import { type EmployeeModel } from '../../settings/employee/employee.model';
import { EmployeeSalaryService } from '../../settings/employee/employee-salary.service';

@Component({
  selector: 'app-payroll-prepare',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, DatePipe, ReactiveFormsModule,
    MatButtonModule, MatFormFieldModule, MatIconModule, MatSelectModule, MatTabsModule,
    TableAutocomplete, EarningsTabsComponent, DeductionsTabsComponent,
  ],
  templateUrl: './payroll-prepare.component.html',
  styleUrl: './payroll-prepare.component.scss',
})
export class PayrollPrepareComponent implements OnInit {
  readonly svc                    = inject(PayrollPrepareService);
  private readonly salarySvc      = inject(EmployeeSalaryService);
  private readonly toast          = inject(ToastService);
  private readonly router         = inject(Router);
  private readonly destroyRef     = inject(DestroyRef);

  readonly employeeCtrl     = new FormControl<number | null>(null);
  readonly selectedEmployee = signal<EmployeeModel | null>(null);

  readonly employeeSalary = computed(() => {
    const emp = this.selectedEmployee();
    return emp ? this.salarySvc.getByEmployeeId(emp.id) : null;
  });

  readonly employeeCols: TableColumn<EmployeeModel>[] = [
    { key: 'employeeNo', label: 'Emp #' },
    { key: 'firstName',  label: 'First Name' },
    { key: 'lastName',   label: 'Last Name' },
  ];

  readonly empDisplayFn = (item: EmployeeModel): string =>
    `${item.firstName} ${item.lastName} — ${item.employeeNo}`;

  readonly lastSavedAt    = signal<Date | null>(null);
  readonly saving         = signal(false);
  readonly submitting     = signal(false);

  readonly lastSavedLabel = computed(() => {
    const d = this.lastSavedAt();
    if (!d) return '';
    return `Saved at ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  });

  onEmployeeSelected(item: unknown): void {
    this.selectedEmployee.set(item as EmployeeModel);
  }

  ngOnInit(): void {
    this.svc.loadEntries();

    const id = setInterval(async () => {
      if (this.svc.dirtyCount() > 0) {
        try {
          await this.svc.saveAll();
          this.lastSavedAt.set(new Date());
        } catch { /* error already toasted by service */ }
      }
    }, 60_000);

    this.destroyRef.onDestroy(() => clearInterval(id));
  }

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
    if (this.svc.dirtyCount() > 0) {
      await this.saveDraft();
    }
    this.submitting.set(true);
    try {
      await this.svc.submit();
      this.toast.success('Payroll run submitted for review.');
      this.router.navigate(['/payroll']);
    } catch {
      this.toast.error('Submission failed. Please try again.');
    } finally {
      this.submitting.set(false);
    }
  }
}
