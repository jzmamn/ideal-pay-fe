import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmployeeAllowances } from '../../../../../settings/employee/employee-fixed-allowance/employee-fixed-allowance.component';

@Component({
  selector: 'app-fixed-allowance',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmployeeAllowances],
  template: `<app-employee-allowances />`,
})
export class FixedAllowanceComponent {}
