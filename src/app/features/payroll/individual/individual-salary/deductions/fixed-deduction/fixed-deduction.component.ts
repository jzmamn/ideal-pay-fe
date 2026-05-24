import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmployeeDeductions } from '../../../../../settings/employee/employee-deductions/employee-deductions.component';

@Component({
  selector: 'app-fixed-deduction',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmployeeDeductions],
  template: `<app-employee-deductions />`,
})
export class FixedDeductionComponent {}
