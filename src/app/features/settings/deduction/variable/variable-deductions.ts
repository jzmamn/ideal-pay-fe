import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Deduction } from '../deduction';
import { DeductionType } from '../deduction.types';

@Component({
  selector: 'app-variable-deductions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Deduction],
  template: `<app-deduction [deductionType]="deductionType" />`,
})
export class VariableDeductions {
  readonly deductionType = DeductionType.VARIABLE;
}
