import { ChangeDetectionStrategy, Component, OnInit, inject, output, signal } from '@angular/core';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartData, ChartOptions } from 'chart.js';
import { PayrollDataService, Department } from '../../services/payroll-data.service';

@Component({
  selector: 'app-dept-donut-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BaseChartDirective],
  templateUrl: './dept-donut-chart.component.html',
  styleUrl: './dept-donut-chart.component.scss',
})
export class DeptDonutChartComponent implements OnInit {
  private dataService = inject(PayrollDataService);

  deptClick = output<Department>();

  private depts = signal<Department[]>([]);

  chartData = signal<ChartData<'doughnut'>>({ labels: [], datasets: [] });

  private readonly PALETTE = [
    '#185FA5', '#3B6D11', '#854F0B', '#A32D2D',
    '#4a90d9', '#7b5ea7', '#2a7f74',
  ];

  chartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    cutout: '65%',
  };

  legendItems = signal<{ label: string; color: string; value: string }[]>([]);

  ngOnInit(): void {
    this.dataService.getDepts().subscribe(data => {
      this.depts.set(data);
      const totals = data.map(d => d.base + d.bonus + d.ot + d.ben);
      this.chartData.set({
        labels: data.map(d => d.name),
        datasets: [{
          data: totals,
          backgroundColor: this.PALETTE,
          hoverOffset: 8,
        }],
      });
      const grand = totals.reduce((a, b) => a + b, 0);
      this.legendItems.set(data.map((d, i) => ({
        label: d.name,
        color: this.PALETTE[i],
        value: `${((totals[i] / grand) * 100).toFixed(1)}%`,
      })));
    });
  }

  onChartClick(event: { event?: unknown; active?: object[] }): void {
    const active = event.active ?? [];
    if (active.length === 0) return;
    const idx = (active[0] as { index: number }).index;
    const dept = this.depts()[idx];
    if (dept) this.deptClick.emit(dept);
  }
}
