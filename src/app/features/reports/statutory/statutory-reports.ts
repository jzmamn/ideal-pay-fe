import {
  ChangeDetectionStrategy, Component, computed,
  inject, signal, OnInit,
} from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

import { ReportsService } from '../reports.service';

import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

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

/**
 * Report keys backed by the generic report engine (sp_rpt_* procedures
 * registered in V12/V13 — see `ReportsService.run`). Reports not in this
 * set are still defined for the UI/picker but have no backing stored
 * procedure yet, so `load()` leaves them empty rather than erroring.
 */
const LIVE_REPORT_KEYS = new Set(['epf-monthly', 'etf-monthly', 'apit-monthly']);

// ── Statutory report definitions ─────────────────────────────────────────────

export interface StatutoryReportDef {
  id: string;
  label: string;
  shortCode: string;
  icon: string;
  authority: string;
  description: string;
  legalRef: string;
  columns: string[];
  columnLabels: Record<string, string>;
}

export const STATUTORY_REPORTS: StatutoryReportDef[] = [
  {
    id: 'epf-monthly',
    label: 'EPF Monthly Contribution',
    shortCode: 'EPF',
    icon: 'percent',
    authority: 'Central Bank of Sri Lanka',
    description: 'Monthly EPF contribution return — Employee 8%, Employer 12%',
    legalRef: 'Employees\' Provident Fund Act No. 15 of 1958',
    columns: ['empCode', 'empName', 'nic', 'basicSalary', 'employeeContribution', 'employerContribution', 'totalContribution', 'period'],
    columnLabels: {
      empCode: 'Emp #', empName: 'Employee', nic: 'NIC',
      basicSalary: 'Basic Salary (LKR)',
      employeeContribution: 'Employee 8% (LKR)',
      employerContribution: 'Employer 12% (LKR)',
      totalContribution: 'Total EPF (LKR)',
      period: 'Period',
    },
  },
  {
    id: 'etf-monthly',
    label: 'ETF Monthly Contribution',
    shortCode: 'ETF',
    icon: 'account_balance',
    authority: 'Employees\' Trust Fund Board',
    description: 'Monthly ETF contribution return — Employer 3% of total earnings',
    legalRef: 'Employees\' Trust Fund Act No. 46 of 1980',
    columns: ['empCode', 'empName', 'nic', 'totalEarnings', 'etfContribution', 'period'],
    columnLabels: {
      empCode: 'Emp #', empName: 'Employee', nic: 'NIC',
      totalEarnings: 'Total Earnings (LKR)',
      etfContribution: 'ETF 3% (LKR)',
      period: 'Period',
    },
  },
  {
    id: 'apit-monthly',
    label: 'APIT Monthly Deduction (T10)',
    shortCode: 'APIT',
    icon: 'receipt',
    authority: 'Inland Revenue Department',
    description: 'Advance Personal Income Tax monthly deduction schedule',
    legalRef: 'Inland Revenue Act No. 24 of 2017',
    columns: ['empCode', 'empName', 'nic', 'grossIncome', 'taxableIncome', 'taxDeducted', 'period'],
    columnLabels: {
      empCode: 'Emp #', empName: 'Employee', nic: 'NIC',
      grossIncome: 'Gross Income (LKR)',
      taxableIncome: 'Taxable Income (LKR)',
      taxDeducted: 'APIT Deducted (LKR)',
      period: 'Period',
    },
  },
  {
    id: 't10-annual',
    label: 'T10 Annual Tax Certificate',
    shortCode: 'T10',
    icon: 'description',
    authority: 'Inland Revenue Department',
    description: 'Annual APIT certificate issued to each employee for tax filing',
    legalRef: 'Inland Revenue Act No. 24 of 2017 — Section 84',
    columns: ['empCode', 'empName', 'nic', 'annualGrossIncome', 'annualTaxableIncome', 'annualTaxDeducted', 'year'],
    columnLabels: {
      empCode: 'Emp #', empName: 'Employee', nic: 'NIC',
      annualGrossIncome: 'Annual Gross (LKR)',
      annualTaxableIncome: 'Annual Taxable (LKR)',
      annualTaxDeducted: 'Total Tax (LKR)',
      year: 'Year',
    },
  },
  {
    id: 'epf-annual',
    label: 'Annual EPF Return (Form 5)',
    shortCode: 'EPF-A',
    icon: 'assignment',
    authority: 'Central Bank of Sri Lanka',
    description: 'Annual EPF declaration (Form 5) for all employees',
    legalRef: 'Employees\' Provident Fund Act No. 15 of 1958 — Regulation 5',
    columns: ['empCode', 'empName', 'nic', 'annualEmployeeContribution', 'annualEmployerContribution', 'annualTotal', 'year'],
    columnLabels: {
      empCode: 'Emp #', empName: 'Employee', nic: 'NIC',
      annualEmployeeContribution: 'Employee Total (LKR)',
      annualEmployerContribution: 'Employer Total (LKR)',
      annualTotal: 'Annual EPF Total (LKR)',
      year: 'Year',
    },
  },
  {
    id: 'salary-certificate',
    label: 'Salary Certificate',
    shortCode: 'SAL-CERT',
    icon: 'workspace_premium',
    authority: 'Employer / IRD',
    description: 'Official salary certificate for banks, visa, and IRD purposes',
    legalRef: 'Inland Revenue Act — Supporting documentation',
    columns: ['empCode', 'empName', 'designation', 'department', 'basicSalary', 'totalEarnings', 'totalDeductions', 'netPay'],
    columnLabels: {
      empCode: 'Emp #', empName: 'Employee',
      designation: 'Designation', department: 'Department',
      basicSalary: 'Basic (LKR)', totalEarnings: 'Gross (LKR)',
      totalDeductions: 'Deductions (LKR)', netPay: 'Net Pay (LKR)',
    },
  },
  {
    id: 'gratuity',
    label: 'Gratuity Report',
    shortCode: 'GRAT',
    icon: 'card_giftcard',
    authority: 'Department of Labour',
    description: 'Gratuity liability report per employee (½ month per year of service)',
    legalRef: 'Payment of Gratuity Act No. 12 of 1983',
    columns: ['empCode', 'empName', 'joinDate', 'yearsOfService', 'lastBasicSalary', 'gratuityAmount', 'status'],
    columnLabels: {
      empCode: 'Emp #', empName: 'Employee',
      joinDate: 'Join Date', yearsOfService: 'Years of Service',
      lastBasicSalary: 'Last Basic (LKR)',
      gratuityAmount: 'Gratuity (LKR)', status: 'Status',
    },
  },
  {
    id: 'workmen-compensation',
    label: 'Workmen\'s Compensation',
    shortCode: 'WC',
    icon: 'health_and_safety',
    authority: 'Department of Labour',
    description: 'Workmen\'s compensation insurance coverage register',
    legalRef: 'Workmen\'s Compensation Ordinance No. 19 of 1935',
    columns: ['empCode', 'empName', 'designation', 'department', 'basicSalary', 'compensationRate', 'annualPremium'],
    columnLabels: {
      empCode: 'Emp #', empName: 'Employee',
      designation: 'Designation', department: 'Department',
      basicSalary: 'Basic (LKR)',
      compensationRate: 'Rate (%)',
      annualPremium: 'Annual Premium (LKR)',
    },
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-statutory-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LowerCasePipe, ReactiveFormsModule,
    MatButtonModule, MatDividerModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatProgressSpinnerModule,
    MatSelectModule, MatTableModule, MatTooltipModule,
    MatChipsModule,
  ],
  templateUrl: './statutory-reports.html',
  styleUrl: './statutory-reports.scss',
})
export class StatutoryReports implements OnInit {
  private readonly fb       = inject(FormBuilder);
  private readonly route    = inject(ActivatedRoute);
  private readonly reports$ = inject(ReportsService);

  readonly months  = MONTHS;
  readonly years   = YEARS;
  readonly activeReport = signal<StatutoryReportDef>(STATUTORY_REPORTS[0]);
  readonly loading      = signal(false);
  readonly rows         = signal<Record<string, unknown>[]>([]);
  readonly searchQuery  = signal('');

  readonly filterForm = this.fb.group({
    month: [new Date().getMonth() + 1],
    year:  [currentYear],
  });

  readonly columns      = computed(() => this.activeReport().columns);
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
        const match = STATUTORY_REPORTS.find(r => r.id === type);
        if (match) this.activeReport.set(match);
      }
    });
  }

  load(): void {
    const report = this.activeReport();
    this.rows.set([]);

    if (!LIVE_REPORT_KEYS.has(report.id)) {
      // No backing stored procedure registered yet for this report —
      // surface an empty result rather than calling an endpoint that 404s.
      return;
    }

    const { month, year } = this.filterForm.value;
    const filters = { month: `${year}-${String(month).padStart(2, '0')}` };

    this.loading.set(true);
    this.reports$.run(report.id, filters)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next:  (rows) => this.rows.set(rows),
        error: ()     => this.rows.set([]),
      });
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
  }

  /** Print-friendly output via the browser print dialog + a `@media print` stylesheet. */
  print(): void {
    window.print();
  }

  exportCsv(): void {
    const report = this.activeReport();
    const data   = this.filteredRows();
    if (!data.length) return;

    const header   = report.columns.map(c => report.columnLabels[c]).join(',');
    const rowLines = data.map(r =>
      report.columns.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [header, ...rowLines].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${report.shortCode}-${this.filterForm.value.year}-${String(this.filterForm.value.month).padStart(2, '0')}.csv`;
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
    document.getElementById('statutory-import-input')?.click();
  }
}
