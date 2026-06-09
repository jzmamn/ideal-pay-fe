import {
  ChangeDetectionStrategy, Component, DestroyRef, computed,
  inject, signal, OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LowerCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';

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

import { ReportsService } from './reports.service';
import { ReportColumn, ReportDefinition, ReportRow } from './report-definition.model';

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

const STATUS_COLUMN_TYPES = new Set(['STATUS']);
const NUMERIC_COLUMN_TYPES = new Set(['NUMBER', 'CURRENCY']);

// ── Component ────────────────────────────────────────────────────────────────
//
// Generic, metadata-driven report viewer (ADR-001, Option B). Report
// identity, filters, and columns all come from the report engine registry
// (GET /payroll/reports) — this component renders whatever metadata it's
// given rather than hardcoding a REPORT_DEFS table per report. Filters,
// table rendering, CSV export, and printing are therefore "free" for any
// new report registered on the backend.

@Component({
  selector: 'app-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LowerCasePipe, ReactiveFormsModule,
    MatButtonModule, MatButtonToggleModule, MatCheckboxModule,
    MatDividerModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatProgressSpinnerModule, MatSelectModule,
    MatTableModule, MatTooltipModule,
  ],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports implements OnInit {
  private readonly fb         = inject(FormBuilder);
  private readonly route      = inject(ActivatedRoute);
  private readonly reports$   = inject(ReportsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly months = MONTHS;
  readonly years  = YEARS;

  readonly reportList   = signal<ReportDefinition[]>([]);
  readonly reportsReady = signal(false);
  readonly activeReport = signal<ReportDefinition | null>(null);
  readonly loading      = signal(false);
  readonly rows         = signal<ReportRow[]>([]);
  readonly searchQuery  = signal('');

  readonly filterForm = this.fb.group({
    month:  [new Date().getMonth() + 1],
    year:   [currentYear],
    search: [''],
  });

  /** True while the active report declares at least one MONTH-type parameter. */
  readonly needsPeriodFilter = computed(() =>
    (this.activeReport()?.parameters ?? []).some(p => p.paramType === 'MONTH'));

  readonly columns = computed<ReportColumn[]>(() => this.activeReport()?.columns ?? []);
  readonly columnKeys = computed(() => this.columns().map(c => c.columnKey));

  readonly filteredRows = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.rows();
    return this.rows().filter(r =>
      Object.values(r).some(v => String(v ?? '').toLowerCase().includes(q))
    );
  });

  ngOnInit(): void {
    this.reports$.list().subscribe(defs => {
      this.reportList.set(defs);
      this.reportsReady.set(true);

      const requestedKey = this.route.snapshot.queryParamMap.get('type');
      const initial = defs.find(d => d.reportKey === requestedKey) ?? defs[0] ?? null;
      if (initial) this.activeReport.set(initial);
    });

    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const key = params.get('type');
        if (!key) return;
        const match = this.reportList().find(r => r.reportKey === key);
        if (match) this.selectReport(match);
      });
  }

  selectReport(report: ReportDefinition): void {
    if (this.activeReport()?.reportKey === report.reportKey) return;
    this.activeReport.set(report);
    this.rows.set([]);
  }

  load(): void {
    const report = this.activeReport();
    if (!report) return;

    const filters = this.buildFilters(report);

    this.loading.set(true);
    this.reports$.run(report.reportKey, filters)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next:  (rows) => this.rows.set(rows),
        error: ()     => this.rows.set([]),
      });
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
  }

  /** Renders a cell value according to its column's declared data type. */
  formatCell(row: ReportRow, column: ReportColumn): string {
    const value = row[column.columnKey];
    if (value === null || value === undefined || value === '') return '—';

    switch (column.dataType) {
      case 'CURRENCY':
        return Number(value).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      case 'NUMBER':
        return Number(value).toLocaleString('en-LK');
      case 'DATE':
        return new Date(String(value)).toLocaleDateString('en-LK', { year: 'numeric', month: 'short', day: '2-digit' });
      default:
        return String(value);
    }
  }

  isStatusColumn(column: ReportColumn): boolean {
    return STATUS_COLUMN_TYPES.has(column.dataType);
  }

  isNumericColumn(column: ReportColumn): boolean {
    return NUMERIC_COLUMN_TYPES.has(column.dataType);
  }

  exportCsv(): void {
    const report = this.activeReport();
    const cols = this.columns();
    const data = this.filteredRows();
    if (!report || !data.length) return;

    const header = cols.map(c => c.label).join(',');
    const rowLines = data.map(r =>
      cols.map(c => `"${String(r[c.columnKey] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csv = [header, ...rowLines].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${report.reportKey}-${this.periodSuffix()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Print-friendly output via the browser print dialog + a `@media print` stylesheet. */
  print(): void {
    window.print();
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

  // ── Internals ────────────────────────────────────────────

  /**
   * Translates the generic filter form into the raw key/value map the
   * report engine expects, based on each report's declared parameters.
   * MONTH-type params are combined from the month/year pickers into
   * "YYYY-MM"; other types fall back to their configured default.
   */
  private buildFilters(report: ReportDefinition): Record<string, string> {
    const filters: Record<string, string> = {};
    const { month, year } = this.filterForm.value;

    for (const param of report.parameters) {
      if (param.paramType === 'MONTH') {
        filters[param.paramKey] = `${year}-${String(month).padStart(2, '0')}`;
      } else if (param.defaultValue) {
        filters[param.paramKey] = param.defaultValue;
      }
    }
    return filters;
  }

  private periodSuffix(): string {
    const { month, year } = this.filterForm.value;
    return this.needsPeriodFilter() ? `${year}-${String(month).padStart(2, '0')}` : 'export';
  }
}
