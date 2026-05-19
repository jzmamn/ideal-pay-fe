import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Allowances } from '../allowances';
import { AllowanceType } from '../allowance.types';

@Component({
  selector: 'app-fixed-allowances',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Allowances],
  template: `<app-allowances [allowanceType]="allowanceType" />`,
})
export class FixedAllowances {
  readonly allowanceType = AllowanceType.FIXED;
}
