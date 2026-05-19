import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MetricCardComponent } from './components/metric-card/metric-card.component';
import { PayrollTrendChartComponent } from './components/payroll-trend-chart/payroll-trend-chart.component';
import { DeptDonutChartComponent } from './components/dept-donut-chart/dept-donut-chart.component';
import { HeadcountBarChartComponent } from './components/headcount-bar-chart/headcount-bar-chart.component';
import { BenefitsOtLineChartComponent } from './components/benefits-ot-line-chart/benefits-ot-line-chart.component';
import { DeptSummaryTableComponent } from './components/dept-summary-table/dept-summary-table.component';
import { PivotTableComponent } from './components/pivot-table/pivot-table.component';
import { EmployeeTableComponent } from './components/employee-table/employee-table.component';

import { MetricDetailModalComponent, MetricDetailData } from './modals/metric-detail-modal/metric-detail-modal.component';
import { DeptDetailModalComponent } from './modals/dept-detail-modal/dept-detail-modal.component';
import { EmployeeDetailModalComponent } from './modals/employee-detail-modal/employee-detail-modal.component';

import { PayrollDataService, Metric, Department, Employee } from './services/payroll-data.service';

type Period = 'month' | 'quarter' | 'year';

@Component({
  selector: 'app-payroll-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatTooltipModule,
    MetricCardComponent,
    PayrollTrendChartComponent,
    DeptDonutChartComponent,
    HeadcountBarChartComponent,
    BenefitsOtLineChartComponent,
    DeptSummaryTableComponent,
    PivotTableComponent,
    EmployeeTableComponent,
  ],
  templateUrl: './payroll-dashboard.component.html',
  styleUrl: './payroll-dashboard.component.scss',
})
export class PayrollDashboardComponent implements OnInit {
  private dialog = inject(MatDialog);
  private dataService = inject(PayrollDataService);

  metrics = signal<Metric[]>([]);
  period = signal<Period>('month');

  ngOnInit(): void {
    this.dataService.getMetrics().subscribe(m => this.metrics.set(m));
  }

  openMetricModal(metric: Metric): void {
    this.dataService.getMetricBreakdown(metric.id).subscribe(breakdown => {
      const data: MetricDetailData = {
        metric,
        breakdown,
        narrative: this.dataService.getMetricNarrative(metric.id),
      };
      this.dialog.open(MetricDetailModalComponent, {
        data,
        panelClass: 'payroll-dialog',
        autoFocus: 'dialog',
      });
    });
  }

  openDeptModal(dept: Department): void {
    this.dialog.open(DeptDetailModalComponent, {
      data: dept,
      panelClass: 'payroll-dialog',
      autoFocus: 'dialog',
    });
  }

  openEmployeeModal(emp: Employee): void {
    this.dialog.open(EmployeeDetailModalComponent, {
      data: emp,
      panelClass: 'payroll-dialog',
      autoFocus: 'dialog',
    });
  }

  exportData(): void {
    const blob = new Blob(['Export not yet connected to a real API.'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payroll-export.txt';
    a.click();
    URL.revokeObjectURL(url);
  }
}
