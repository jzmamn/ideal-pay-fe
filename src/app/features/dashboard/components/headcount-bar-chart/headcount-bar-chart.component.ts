import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartData, ChartOptions } from 'chart.js';
import { PayrollDataService } from '../../services/payroll-data.service';

@Component({
  selector: 'app-headcount-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective],
  templateUrl: './headcount-bar-chart.component.html',
  styleUrl: './headcount-bar-chart.component.scss',
})
export class HeadcountBarChartComponent implements OnInit {
  private dataService = inject(PayrollDataService);

  chartData = signal<ChartData<'bar'>>({ labels: [], datasets: [] });

  chartOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { stepSize: 10 }, grid: { color: '#f0f0f0' } },
      y: { grid: { display: false } },
    },
  };

  ngOnInit(): void {
    this.dataService.getDepts().subscribe(data => {
      this.chartData.set({
        labels: data.map(d => d.name),
        datasets: [{
          label: 'Headcount',
          data: data.map(d => d.hc),
          backgroundColor: '#185FA5',
          borderRadius: 4,
        }],
      });
    });
  }
}
