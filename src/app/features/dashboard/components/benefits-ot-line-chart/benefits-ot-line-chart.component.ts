import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartData, ChartOptions } from 'chart.js';
import { PayrollDataService } from '../../services/payroll-data.service';

@Component({
  selector: 'app-benefits-ot-line-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective],
  templateUrl: './benefits-ot-line-chart.component.html',
  styleUrl: './benefits-ot-line-chart.component.scss',
})
export class BenefitsOtLineChartComponent implements OnInit {
  private dataService = inject(PayrollDataService);

  chartData = signal<ChartData<'line'>>({ labels: [], datasets: [] });

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        ticks: { callback: (v) => `$${(+v / 1000).toFixed(0)}K` },
        grid: { color: '#f0f0f0' },
      },
      x: { grid: { display: false } },
    },
  };

  readonly legendItems = [
    { label: 'Benefits', color: '#3B6D11' },
    { label: 'Overtime', color: '#854F0B' },
  ];

  ngOnInit(): void {
    this.dataService.getMonthly().subscribe(data => {
      this.chartData.set({
        labels: data.map(d => d.month),
        datasets: [
          {
            label: 'Benefits',
            data: data.map(d => d.ben),
            borderColor: '#3B6D11',
            backgroundColor: 'rgba(59, 109, 17, 0.12)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
          },
          {
            label: 'Overtime',
            data: data.map(d => d.ot),
            borderColor: '#854F0B',
            backgroundColor: 'rgba(133, 79, 11, 0.12)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
          },
        ],
      });
    });
  }
}
