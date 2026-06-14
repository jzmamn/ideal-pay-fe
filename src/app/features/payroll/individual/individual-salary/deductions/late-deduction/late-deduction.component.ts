import {
  ChangeDetectionStrategy, Component,
  computed, effect, inject, signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { lastValueFrom } from 'rxjs';
import { IndividualSalaryService } from '../../shared/individual-salary.service';
import { ExportButtonComponent } from '../../../../../import-export/export-button/export-button.component';
import { EmployeeProfileService } from '../../../../../settings/employee/employee-profile.service';
import type { EmployeeLateRequest, EmployeeLateResponse } from '../../../../../settings/employee/employee-profile.model';

/** One row per (employee × late-deduction-config). */
interface LateItem {
  /** emp_late record id — 0 means not yet persisted for this config. */
  recordId:       number;
  employeeId:     number;
  empCode:        string;
  empName:        string;
  /** Late config that produced the rate. Null for legacy single-config records. */
  lateConfigId:   number | null;
  lateConfigCode: string | null;
  lateConfigName: string | null;
  /** Rate per hour set by the server load phase. Read-only in the UI. */
  rate:   number;
  hours:  number;
  amount: number;
}

@Component({
  selector: 'app-late-deduction',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, ReactiveFormsModule,
    MatButtonModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatTooltipModule,
    ExportButtonComponent,
  ],
  templateUrl: './late-deduction.component.html',
  styleUrl: './late-deduction.component.scss',
})
export class LateDeductionComponent {
  private readonly svc        = inject(IndividualSalaryService);
  private readonly profileSvc = inject(EmployeeProfileService);

  readonly items        = signal<LateItem[]>([]);
  readonly editingIndex = signal<number | null>(null);
  readonly loading      = signal(false);

  readonly total = computed(() =>
    this.items().reduce((s, i) => s + i.amount, 0));

  readonly payrollMonth = computed(() =>
    `${this.svc.periodYear()}-${String(this.svc.periodMonth()).padStart(2, '0')}`);

  readonly editHoursCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(0)],
  });

  constructor() {
    // Reload whenever the payroll period changes.
    effect(() => {
      const month = this.payrollMonth();
      if (month) void this.loadFromServer(month);
    });
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  private async loadFromServer(payrollMonth: string): Promise<void> {
    this.loading.set(true);
    try {
      const records: EmployeeLateResponse[] =
        await lastValueFrom(this.profileSvc.getLatesByPeriod(payrollMonth));
      this.items.set(records.map(r => this.toItem(r)));
    } catch {
      // Period not loaded yet — keep current items.
    } finally {
      this.loading.set(false);
    }
  }

  // ── Edit flow ─────────────────────────────────────────────────────────────

  startEdit(index: number): void {
    this.editHoursCtrl.setValue(this.items()[index].hours);
    this.editHoursCtrl.markAsUntouched();
    this.editingIndex.set(index);
  }

  async saveEdit(index: number): Promise<void> {
    if (this.editHoursCtrl.invalid) { this.editHoursCtrl.markAsTouched(); return; }

    const hours = Number(this.editHoursCtrl.value ?? 0);
    const item  = this.items()[index];

    // Optimistic update using the server-stored rate.
    const optimisticAmount = Math.round(item.rate * hours * 100) / 100;
    this.items.update(list =>
      list.map((it, i) => i === index ? { ...it, hours, amount: optimisticAmount } : it));
    this.editingIndex.set(null);

    const req: EmployeeLateRequest = {
      ...(item.recordId > 0 ? { id: item.recordId } : {}),
      empId:        item.employeeId,
      ...(item.lateConfigId != null ? { lateConfigId: item.lateConfigId } : {}),
      hours,
      // amount intentionally omitted — server recalculates as rate × hours
      payrollMonth: this.payrollMonth(),
      isProcessed:  false,
      createdBy:    1,
      modifiedBy:   1,
    };

    try {
      const saved = await lastValueFrom(this.profileSvc.saveLate(req));
      // Sync with the authoritative server response.
      this.items.update(list =>
        list.map((it, i) => i === index ? this.toItem(saved) : it));
    } catch {
      // Revert optimistic update on failure.
      this.items.update(list =>
        list.map((it, i) =>
          i === index ? { ...it, hours: item.hours, amount: item.amount } : it));
    }
  }

  cancelEdit(): void { this.editingIndex.set(null); }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private toItem(r: EmployeeLateResponse): LateItem {
    return {
      recordId:       r.id       ?? 0,
      employeeId:     r.empId,
      empCode:        r.empCode,
      empName:        r.empName,
      lateConfigId:   r.lateConfigId   ?? null,
      lateConfigCode: r.lateConfigCode ?? null,
      lateConfigName: r.lateConfigName ?? null,
      rate:           r.rate   ?? 0,
      hours:          r.hours  ?? 0,
      amount:         r.amount ?? 0,
    };
  }
}
