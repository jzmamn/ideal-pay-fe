import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { GridSkeletonComponent } from '../shared/grid-skeleton/grid-skeleton.component';
import { FixedDeductionComponent } from './fixed-deduction/fixed-deduction.component';
import { VariableDeductionComponent } from './variable-deduction/variable-deduction.component';
import { NoPayComponent } from './no-pay/no-pay.component';
import { LoansComponent } from './loans/loans.component';
import { TaxComponent } from './tax/tax.component';
import { SalaryDecrementComponent } from './salary-decrement/salary-decrement.component';

type DeductionsTab = 'fixed-deduction' | 'variable-deduction' | 'no-pay'
                   | 'loans' | 'tax' | 'salary-decrement';

@Component({
  selector: 'app-deductions-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, GridSkeletonComponent,
    FixedDeductionComponent, VariableDeductionComponent, NoPayComponent,
    LoansComponent, TaxComponent, SalaryDecrementComponent,
  ],
  templateUrl: './deductions-tabs.component.html',
  styleUrl: './deductions-tabs.component.scss',
})
export class DeductionsTabsComponent {
  readonly activeTab = signal<DeductionsTab>('fixed-deduction');

  readonly tabs: { id: DeductionsTab; label: string }[] = [
    { id: 'fixed-deduction',    label: 'Fixed Deduction'    },
    { id: 'variable-deduction', label: 'Variable Deduction' },
    { id: 'no-pay',             label: 'No Pay'             },
    { id: 'loans',              label: 'Loans'              },
    { id: 'tax',                label: 'Tax'                },
    { id: 'salary-decrement',   label: 'Salary Decrement'   },
  ];
}
