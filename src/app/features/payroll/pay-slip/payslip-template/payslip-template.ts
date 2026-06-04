import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';
import { PayrollRunResponse } from '../../shared/payroll-run.model';
import { EmployeeResponse } from '../../../settings/employee/employee.model';

export type PayslipLayout = 'portrait' | 'landscape';

@Component({
  selector: 'app-payslip-template',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, MatDividerModule],
  templateUrl: './payslip-template.html',
  styleUrl: './payslip-template.scss',
})
export class PayslipTemplate {
  readonly run         = input.required<PayrollRunResponse>();
  readonly employee    = input<EmployeeResponse | null>(null);
  readonly layout      = input<PayslipLayout>('portrait');
  readonly companyName = input<string>('Ideal Pay');

  // ── Derived earning/deduction lines from run details ─────────────────

  readonly earnings = computed(() => {
    const r = this.run();
    const lines: { label: string; amount: number }[] = [
      { label: 'Basic Salary', amount: r.basicSalary },
    ];
    for (const d of r.details ?? []) {
      const t = d.componentType;
      if (
        t === 'FIXED_ALLOWANCE' || t === 'VARIABLE_ALLOWANCE' ||
        t === 'OVERTIME'        || t === 'BONUS'               ||
        t === 'INCREMENT'       || t === 'GRATUITY'
      ) {
        lines.push({ label: d.componentName, amount: d.amount });
      }
    }
    return lines;
  });

  readonly deductions = computed(() => {
    const r = this.run();
    const lines: { label: string; amount: number }[] = [];

    if (r.employeeEpf > 0) lines.push({ label: 'EPF — Employee', amount: r.employeeEpf });
    if (r.etf        > 0) lines.push({ label: 'ETF',             amount: r.etf        });
    if (r.payeTax    > 0) lines.push({ label: 'PAYE Tax',         amount: r.payeTax    });

    for (const d of r.details ?? []) {
      const t = d.componentType;
      if (
        t === 'FIXED_DEDUCTION' || t === 'VARIABLE_DEDUCTION' ||
        t === 'LOP'             || t === 'LOAN_EMI'            ||
        t === 'TAX'             || t === 'DECREMENT'
      ) {
        lines.push({ label: d.componentName, amount: d.amount });
      }
    }
    return lines;
  });

  readonly periodLabel = computed(() => {
    const m = this.run().payrollMonth; // "2026-05"
    if (!m) return '';
    const [y, mo] = m.split('-');
    const date = new Date(+y, +mo - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  });

  readonly empFullName = computed(() => {
    const e = this.employee();
    if (e) return `${e.firstName} ${e.lastName}`;
    return this.run().empName;
  });

  readonly empCode = computed(() => {
    const e = this.employee();
    return e?.employeeNo ?? this.run().empCode;
  });

  readonly designation = computed(() => this.employee()?.designationName ?? '');
  readonly department  = computed(() => this.employee()?.jobCategoryName  ?? '');
}
