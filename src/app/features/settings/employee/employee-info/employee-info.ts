import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { EmployeeService } from '../employee.service';
import { MasterDataService } from '../../../../shared/services/master-data.service';

@Component({
  selector: 'app-employee-info',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, MatButtonModule, MatCardModule, MatDividerModule, MatIconModule],
  templateUrl: './employee-info.html',
  styleUrl: './employee-info.scss',
})
export class EmployeeInfo {
  private readonly router = inject(Router);
  readonly service = inject(EmployeeService);
  readonly masterSvc = inject(MasterDataService);
  readonly employee = this.service.selected;

  readonly employeeTypeName = computed(() => {
    const id = this.service.selected()?.employeeTypeId;
    return id != null ? (this.masterSvc.activeEmployeeTypes().find(t => t.id === id)?.name ?? '—') : '—';
  });

  readonly jobCategoryName = computed(() => {
    const id = this.service.selected()?.jobCategoryId;
    return id != null ? (this.masterSvc.jobCategories().find(c => c.id === id)?.name ?? '—') : '—';
  });

  readonly designationName = computed(() => {
    const id = this.service.selected()?.designationId;
    return id != null ? (this.masterSvc.designations().find(d => d.id === id)?.name ?? '—') : '—';
  });

  readonly branchName = computed(() => {
    const id = this.service.selected()?.branchId;
    return id != null ? (this.masterSvc.branches().find(b => b.id === id)?.name ?? '—') : '—';
  });

  readonly gradeName = computed(() => {
    const id = this.service.selected()?.gradeId;
    return id != null ? (this.masterSvc.grades().find(g => g.id === id)?.name ?? '—') : '—';
  });

  constructor() {
    if (!this.service.selected()) {
      this.router.navigate(['/employee']);
    }
  }

  goBack(): void {
    this.router.navigate(['/employee']);
  }

  goEdit(): void {
    this.router.navigate(['/employee/add']);
  }
}
