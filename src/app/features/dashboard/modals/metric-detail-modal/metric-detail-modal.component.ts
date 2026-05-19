import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Metric, MetricMonthlyBreakdown } from '../../services/payroll-data.service';

export interface MetricDetailData {
  metric: Metric;
  breakdown: MetricMonthlyBreakdown[];
  narrative: string;
}

@Component({
  selector: 'app-metric-detail-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './metric-detail-modal.component.html',
  styleUrl: './metric-detail-modal.component.scss',
})
export class MetricDetailModalComponent {
  data = inject<MetricDetailData>(MAT_DIALOG_DATA);

  formatValue(metricId: string, value: number): string {
    if (metricId === 'total-cost') return `$${(value / 1000).toFixed(0)}K`;
    if (metricId === 'avg-cost')   return `$${value.toLocaleString()}`;
    if (metricId === 'overtime')   return `$${(value / 1000).toFixed(0)}K`;
    return `${value}`;
  }
}
