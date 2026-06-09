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
import { EmployeeProfileService } from '../../../../../settings/employee/employee-profile.service';
import type { EmployeeLateRequest } from '../../../../../settings/employee/employee-profile.service';

interface LateItem {
  id: number;
  employeeId: number;
  lateRecordId: number;
  code: string;
  name: string;
  basicPay: number;
  hours: number;
  amount: number;
}

const WORKING_DAYS = 26;
const WORKING_HOURS_PER_DAY = 8;

@Component({
  selector: 'app-late-deduction',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, ReactiveFormsModule,
    MatButtonModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatTooltipModule,
  ],
  templateUrl: './late-deduction.component.html',
  styleUrl: './late-deduction.component.scss',
})
export class LateDeductionComponent {
  private readonly svc        = inject(IndividualSalaryService);
  private readonly profileSvc = inject(EmployeeProfileService);

  readonly items        = signal<LateItem[]>([]);
  readonly editingIndex = signal<number | null>(null);

  readonly total = computed(() => this.items().reduce((s, i) => s + i.amount, 0));

  readonly editHoursCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(0)],
  });

  constructor() {
    effect(() => {
      const entries = this.svc.entries();
      if (entries.length) {
        this.items.set(entries.map(e => ({
          id:           e.id,
          employeeId:   e.employeeId,
          lateRecordId: 0,
          code:         e.empCode,
          name:         e.fullName,
          basicPay:     e.basicPay,
          hours:        0,
          amount:       0,
        })));
      }
    });
  }

  startEdit(index: number): void {
    this.editHoursCtrl.setValue(this.items()[index].hours);
    this.editHoursCtrl.markAsUntouched();
    this.editingIndex.set(index);
  }

  async saveEdit(index: number): Promise<void> {
    if (this.editHoursCtrl.invalid) { this.editHoursCtrl.markAsTouched(); return; }
    const hours      = Number(this.editHoursCtrl.value ?? 0);
    const item       = this.items()[index];
    const hourlyRate = item.basicPay / (WORKING_DAYS * WORKING_HOURS_PER_DAY);
    const amount     = Math.round(hourlyRate * hours * 100) / 100;

    this.items.update(list =>
      list.map((it, i) => i === index ? { ...it, hours, amount } : it)
    );
    this.editingIndex.set(null);

    if (hours > 0) {
      const mm = String(this.svc.periodMonth()).padStart(2, '0');
      const payrollMonth = `${this.svc.periodYear()}-${mm}`;
      const req: EmployeeLateRequest = {
        ...(item.lateRecordId > 0 ? { id: item.lateRecordId } : {}),
        empId:       item.employeeId,
        hours,
        amount,
        payrollMonth,
        isProcessed: false,
        createdBy:   1,
        modifiedBy:  1,
      };
      const saved = await lastValueFrom(this.profileSvc.saveLate(req));
      this.items.update(list =>
        list.map((it, i) => i === index ? { ...it, lateRecordId: saved.id } : it)
      );
    }
  }

  cancelEdit(): void { this.editingIndex.set(null); }

  hourlyRate(item: LateItem): number {
    return item.basicPay / (WORKING_DAYS * WORKING_HOURS_PER_DAY);
  }
}
