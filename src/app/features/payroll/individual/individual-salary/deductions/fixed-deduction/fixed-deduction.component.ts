import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { EmployeeDeductions } from '../../../../../settings/employee/employee-fixed-deduction/employee-fixed-deduction.component';
import { IndividualSalaryService } from '../../shared/individual-salary.service';
import { ExportButtonComponent } from '../../../../../import-export/export-button/export-button.component';

@Component({
  selector: 'app-fixed-deduction',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmployeeDeductions, ExportButtonComponent],
  template: `
    <div class="io-row">
      <app-export-button entity="EMP_FD" [payrollMonth]="payrollMonth()" />
    </div>
    <app-employee-deductions />
  `,
  styles: [`.io-row { display: flex; justify-content: flex-end; padding: 8px 0; }`],
})
export class FixedDeductionComponent {
  private readonly svc = inject(IndividualSalaryService);

  readonly payrollMonth = computed(() =>
    `${this.svc.periodYear()}-${String(this.svc.periodMonth()).padStart(2, '0')}`);
}
