import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Metric } from '../../services/payroll-data.service';

@Component({
  selector: 'app-metric-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  templateUrl: './metric-card.component.html',
  styleUrl: './metric-card.component.scss',
  host: {
    'role': 'button',
    'tabindex': '0',
    '(click)': 'cardClick.emit(metric())',
    '(keydown.enter)': 'cardClick.emit(metric())',
    '(keydown.space)': 'cardClick.emit(metric())',
  },
})
export class MetricCardComponent {
  metric = input.required<Metric>();
  cardClick = output<Metric>();
}
