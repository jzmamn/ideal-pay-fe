import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { GridSkeletonComponent } from '../shared/grid-skeleton/grid-skeleton.component';
import { FixedAllowanceComponent } from './fixed-allowance/fixed-allowance.component';
import { VariableAllowanceComponent } from './variable-allowance/variable-allowance.component';
import { OvertimeComponent } from './overtime/overtime.component';
import { BonusComponent } from './bonus/bonus.component';
import { SalaryIncrementComponent } from './salary-increment/salary-increment.component';
import { GratuityComponent } from './gratuity/gratuity.component';

type EarningsTab = 'fixed-allowance' | 'variable-allowance' | 'overtime'
                 | 'bonus' | 'salary-increment' | 'gratuity';

@Component({
  selector: 'app-earnings-tabs',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule, GridSkeletonComponent,
    FixedAllowanceComponent, VariableAllowanceComponent, OvertimeComponent,
    BonusComponent, SalaryIncrementComponent, GratuityComponent,
  ],
  templateUrl: './earnings-tabs.component.html',
  styleUrl: './earnings-tabs.component.scss',
})
export class EarningsTabsComponent {
  readonly activeTab = signal<EarningsTab>('fixed-allowance');

  readonly tabs: { id: EarningsTab; label: string }[] = [
    { id: 'fixed-allowance',    label: 'Fixed Allowance'    },
    { id: 'variable-allowance', label: 'Variable Allowance' },
    { id: 'overtime',           label: 'Overtime'           },
    { id: 'bonus',              label: 'Bonus'              },
    { id: 'salary-increment',   label: 'Salary Increment'   },
    { id: 'gratuity',           label: 'Gratuity'           },
  ];
}
