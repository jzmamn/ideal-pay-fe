import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-payroll-summary-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  templateUrl: './payroll-summary-bar.component.html',
  styleUrl: './payroll-summary-bar.component.scss',
})
export class PayrollSummaryBarComponent {
  readonly employeeCount = input.required<number>();
  readonly grossTotal    = input.required<number>();
  readonly dedTotal      = input.required<number>();
  readonly netTotal      = input.required<number>();
}
