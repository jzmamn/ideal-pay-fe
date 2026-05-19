import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartData, ChartOptions } from 'chart.js';
import { PayrollDataService } from '../../services/payroll-data.service';

@Component({
  selector: 'app-payroll-trend-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective],
  templateUrl: './payroll-trend-chart.component.html',
  styleUrl: './payroll-trend-chart.component.scss',
})
export class PayrollTrendChartComponent implements OnInit {
  private dataService = inject(PayrollDataService);

  chartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });

  chartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: {
        stacked: true,
        ticks: {
          callback: (value) => `$${(+value / 1000).toFixed(0)}K`,
        },
      },
    },
  };

  readonly legendItems = [
    { label: 'Base',     color: '#185FA5' },
    { label: 'Bonus',    color: '#3B6D11' },
    { label: 'Overtime', color: '#854F0B' },
    { label: 'Benefits', color: '#4a90d9' },
  ];

  ngOnInit(): void {
    this.dataService.getMonthly().subscribe(data => {
      this.chartData.set({
        labels: data.map(d => d.month),
        datasets: [
          { label: 'Base',     data: data.map(d => d.base),  backgroundColor: '#185FA5' },
          { label: 'Bonus',    data: data.map(d => d.bonus), backgroundColor: '#3B6D11' },
          { label: 'Overtime', data: data.map(d => d.ot),    backgroundColor: '#854F0B' },
          { label: 'Benefits', data: data.map(d => d.ben),   backgroundColor: '#4a90d9' },
        ],
      });
    });
  }
}
