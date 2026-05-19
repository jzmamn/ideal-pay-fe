import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Deduction } from '../deduction';
import { DeductionType } from '../deduction.types';

@Component({
  selector: 'app-fixed-deductions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Deduction],
  template: `<app-deduction [deductionType]="deductionType" />`,
})
export class FixedDeductions {
  readonly deductionType = DeductionType.FIXED;
}
