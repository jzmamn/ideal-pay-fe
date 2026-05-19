import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { PayrollDataService, Department } from '../../services/payroll-data.service';

interface PivotRow {
  name: string;
  base: number;
  bonus: number;
  ot: number;
  ben: number;
  total: number;
}

@Component({
  selector: 'app-pivot-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe],
  templateUrl: './pivot-table.component.html',
  styleUrl: './pivot-table.component.scss',
})
export class PivotTableComponent implements OnInit {
  private dataService = inject(PayrollDataService);

  rows = signal<PivotRow[]>([]);

  grandTotal = computed<PivotRow>(() => {
    const r = this.rows();
    return {
      name: 'Grand Total',
      base:  r.reduce((s, x) => s + x.base,  0),
      bonus: r.reduce((s, x) => s + x.bonus, 0),
      ot:    r.reduce((s, x) => s + x.ot,    0),
      ben:   r.reduce((s, x) => s + x.ben,   0),
      total: r.reduce((s, x) => s + x.total, 0),
    };
  });

  ngOnInit(): void {
    this.dataService.getDepts().subscribe((depts: Department[]) => {
      this.rows.set(depts.map(d => ({
        name:  d.name,
        base:  d.base,
        bonus: d.bonus,
        ot:    d.ot,
        ben:   d.ben,
        total: d.base + d.bonus + d.ot + d.ben,
      })));
    });
  }
}
