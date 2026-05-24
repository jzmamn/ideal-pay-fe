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
  employeeCount = input.required<number>();
  grossTotal    = input.required<number>();
  dedTotal      = input.required<number>();
  netTotal      = input.required<number>();
}
