import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { EmployeeAllowances } from '../../../../../settings/employee/employee-fixed-allowance/employee-fixed-allowance.component';
import { IndividualSalaryService } from '../../shared/individual-salary.service';
import { ExportButtonComponent } from '../../../../../import-export/export-button/export-button.component';

@Component({
  selector: 'app-fixed-allowance',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmployeeAllowances, ExportButtonComponent],
  template: `
    <div class="io-row">
      <app-export-button entity="EMP_FA" [payrollMonth]="payrollMonth()" />
    </div>
    <app-employee-allowances />
  `,
  styles: [`.io-row { display: flex; justify-content: flex-end; padding: 8px 0; }`],
})
export class FixedAllowanceComponent {
  private readonly svc = inject(IndividualSalaryService);

  readonly payrollMonth = computed(() =>
    `${this.svc.periodYear()}-${String(this.svc.periodMonth()).padStart(2, '0')}`);
}
