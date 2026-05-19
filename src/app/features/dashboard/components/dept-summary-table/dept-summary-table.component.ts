import { ChangeDetectionStrategy, Component, OnInit, inject, output, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PayrollDataService, Department } from '../../services/payroll-data.service';

interface DeptRow extends Department {
  total: number;
  variance: number;
  variancePct: number;
}

@Component({
  selector: 'app-dept-summary-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTableModule, MatButtonModule, MatIconModule, CurrencyPipe, DecimalPipe],
  templateUrl: './dept-summary-table.component.html',
  styleUrl: './dept-summary-table.component.scss',
})
export class DeptSummaryTableComponent implements OnInit {
  private dataService = inject(PayrollDataService);

  drillClick = output<Department>();

  rows = signal<DeptRow[]>([]);

  displayedColumns = ['dept', 'hc', 'base', 'bonus', 'ot', 'ben', 'total', 'vsBudget', 'actions'];

  ngOnInit(): void {
    this.dataService.getDepts().subscribe(depts => {
      this.rows.set(depts.map(d => {
        const total = d.base + d.bonus + d.ot + d.ben;
        const variance = total - d.budget;
        return { ...d, total, variance, variancePct: (variance / d.budget) * 100 };
      }));
    });
  }

  openDrill(row: DeptRow): void {
    this.drillClick.emit(row);
  }
}
