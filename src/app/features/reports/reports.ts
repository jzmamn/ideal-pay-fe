import {
  ChangeDetectionStrategy, Component, computed,
  inject, signal, OnInit,
} from '@angular/core';
import { DecimalPipe, DatePipe, LowerCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

// ── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  { value: 1,  label: 'January'   },
  { value: 2,  label: 'February'  },
  { value: 3,  label: 'March'     },
  { value: 4,  label: 'April'     },
  { value: 5,  label: 'May'       },
  { value: 6,  label: 'June'      },
  { value: 7,  label: 'July'      },
  { value: 8,  label: 'August'    },
  { value: 9,  label: 'September' },
  { value: 10, label: 'October'   },
  { value: 11, label: 'November'  },
  { value: 12, label: 'December'  },
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - i);

// ── Report definitions ───────────────────────────────────────────────────────

interface ReportDef {
  id: string;
  label: string;
  icon: string;
  description: string;
  columns: string[];
  columnLabels: Record<string, string>;
}

const REPORT_DEFS: ReportDef[] = [
  {
    id: 'payroll-summary',
    label: 'Payroll Summary',
    icon: 'receipt_long',
    description: 'Monthly payroll summary for all employees',
    columns: ['empCode', 'empName', 'department', 'basicSalary', 'totalEarnings', 'totalDeductions', 'netPay', 'status'],
    columnLabels: {
      empCode: 'Emp #', empName: 'Employee', department: 'Department',
      basicSalary: 'Basic (LKR)', totalEarnings: 'Earnings (LKR)',
      totalDeductions: 'Deductions (LKR)', netPay: 'Net Pay (LKR)', status: 'Status',
    },
  },
  {
    id: 'bank-transfer',
    label: 'Bank Transfer',
    icon: 'account_balance_wallet',
    description: 'Bank transfer details per pay period',
    columns: ['empCode', 'empName', 'bankName', 'accountNo', 'branchCode', 'amount', 'transferStatus'],
    columnLabels: {
      empCode: 'Emp #', empName: 'Employee', bankName: 'Bank',
      accountNo: 'Account No.', branchCode: 'Branch', amount: 'Amount (LKR)', transferStatus: 'Status',
    },
  },
  {
    id: 'salary-increment',
    label: 'Salary Increment',
    icon: 'trending_up',
    description: 'Salary increment history and projections',
    columns: ['empCode', 'empName', 'department', 'previousSalary', 'newSalary', 'incrementAmount', 'incrementPct', 'effectiveDate'],
    columnLabels: {
      empCode: 'Emp #', empName: 'Employee', department: 'Department',
      previousSalary: 'Previous (LKR)', newSalary: 'New (LKR)',
      incrementAmount: 'Increment (LKR)', incrementPct: 'Increment %', effectiveDate: 'Effective Date',
    },
  },
  {
    id: 'loan',
    label: 'Loan Report',
    icon: 'request_quote',
    description: 'Loan applications and repayment status',
    columns: ['empCode', 'empName', 'loanType', 'loanAmount', 'balance', 'installment', 'startDate', 'status'],
    columnLabels: {
      empCode: 'Emp #', empName: 'Employee', loanType: 'Loan Type',
      loanAmount: 'Amount (LKR)', balance: 'Balance (LKR)',
      installment: 'Installment (LKR)', startDate: 'Start Date', status: 'Status',
    },
  },
  {
    id: 'salary-advance',
    label: 'Salary Advance',
    icon: 'monetization_on',
    description: 'Salary advance requests and settlements',
    columns: ['empCode', 'empName', 'advanceAmount', 'deductedAmount', 'balance', 'requestDate', 'status'],
    columnLabels: {
      empCode: 'Emp #', empName: 'Employee', advanceAmount: 'Advance (LKR)',
      deductedAmount: 'Deducted (LKR)', balance: 'Balance (LKR)',
      requestDate: 'Request Date', status: 'Status',
    },
  },
  {
    id: 'nopay',
    label: 'No-Pay Report',
    icon: 'event_busy',
    description: 'No-pay days per employee per period',
    columns: ['empCode', 'empName', 'department', 'nopayDays', 'nopayAmount', 'reason', 'period'],
    columnLabels: {
      empCode: 'Emp #', empName: 'Employee', department: 'Department',
      nopayDays: 'No-Pay Days', nopayAmount: 'Amount (LKR)', reason: 'Reason', period: 'Period',
    },
  },
];

// ── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, DatePipe, LowerCasePipe, ReactiveFormsModule,
    MatButtonModule, MatButtonToggleModule, MatCheckboxModule,
    MatDividerModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatProgressSpinnerModule, MatSelectModule,
    MatTableModule, MatTooltipModule,
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports implements OnInit {
  private readonly fb    = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);

  readonly months = MONTHS;
  readonly years  = YEARS;
  readonly reports = REPORT_DEFS;

  readonly activeReport = signal<ReportDef>(REPORT_DEFS[0]);
  readonly loading      = signal(false);
  readonly rows         = signal<Record<string, unknown>[]>([]);
  readonly searchQuery  = signal('');

  readonly filterForm = this.fb.group({
    month:      [new Date().getMonth() + 1],
    year:       [currentYear],
    department: [''],
    search:     [''],
  });

  readonly columns = computed(() => this.activeReport().columns);
  readonly columnLabels = computed(() => this.activeReport().columnLabels);

  readonly filteredRows = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.rows();
    return this.rows().filter(r =>
      Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q))
    );
  });

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const type = params.get('type');
      if (type) {
        const match = REPORT_DEFS.find(r => r.id === type);
        if (match) this.activeReport.set(match);
      }
    });
  }

  selectReport(report: ReportDef): void {
    this.activeReport.set(report);
    this.rows.set([]);
  }

  load(): void {
    this.loading.set(true);
    // Placeholder — replace with real service call
    setTimeout(() => {
      this.rows.set([]);
      this.loading.set(false);
    }, 600);
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
  }

  exportCsv(): void {
    const report = this.activeReport();
    const data = this.filteredRows();
    if (!data.length) return;

    const header = report.columns.map(c => report.columnLabels[c]).join(',');
    const rowLines = data.map(r =>
      report.columns.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [header, ...rowLines].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${report.id}-${this.filterForm.value.year}-${String(this.filterForm.value.month).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    // Placeholder — replace with real import logic
    input.value = '';
  }

  triggerImport(): void {
    document.getElementById('import-file-input')?.click();
  }
}
