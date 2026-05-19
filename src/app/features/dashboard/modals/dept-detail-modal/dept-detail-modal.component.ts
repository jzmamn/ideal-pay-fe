import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Department } from '../../services/payroll-data.service';

@Component({
  selector: 'app-dept-detail-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CurrencyPipe, DecimalPipe],
  templateUrl: './dept-detail-modal.component.html',
  styleUrl: './dept-detail-modal.component.scss',
})
export class DeptDetailModalComponent {
  dept = inject<Department>(MAT_DIALOG_DATA);

  total    = computed(() => this.dept.base + this.dept.bonus + this.dept.ot + this.dept.ben);
  variance = computed(() => this.total() - this.dept.budget);
  variancePct = computed(() => (this.variance() / this.dept.budget) * 100);
  avgCostPerHead = computed(() => Math.round(this.total() / this.dept.hc));
  isOver   = computed(() => this.variance() > 0);
}
