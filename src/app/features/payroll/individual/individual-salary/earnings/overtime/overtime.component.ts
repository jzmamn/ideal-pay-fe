import {
  ChangeDetectionStrategy, Component,
  DestroyRef, computed, effect, inject, input, signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IndividualSalaryService } from '../../shared/individual-salary.service';
import { ExportButtonComponent } from '../../../../../import-export/export-button/export-button.component';
import { EmployeeOvertimeService } from './employee-overtime.service';
import { EmployeeOvertimeRequest, EmployeeOvertimeResponse } from './employee-overtime.model';

@Component({
  selector: 'app-overtime',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, ReactiveFormsModule,
    MatButtonModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatTooltipModule,
    ExportButtonComponent,
  ],
  templateUrl: './overtime.component.html',
  styleUrl: './overtime.component.scss',
})
export class OvertimeComponent {
  private readonly empOtSvc   = inject(EmployeeOvertimeService);
  private readonly salarySvc  = inject(IndividualSalaryService);
  private readonly snackBar   = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  /** Parent passes the selected employee's ID. When null, no data is loaded. */
  readonly empId = input<number | null>(null);

  readonly payrollMonth = computed(() =>
    `${this.salarySvc.periodYear()}-${String(this.salarySvc.periodMonth()).padStart(2, '0')}`);

  readonly records      = signal<EmployeeOvertimeResponse[]>([]);
  readonly editingIndex = signal<number | null>(null);
  readonly saving       = signal(false);

  /** Total OT amount across all types. */
  readonly total = computed(() =>
    this.records().reduce((sum, r) => sum + r.amount, 0));

  /** Hours input for the currently-edited row. */
  readonly editHoursCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(0)],
  });

  /** Emits when empId changes to cancel the previous in-flight load. */
  private readonly cancelLoad$ = new Subject<void>();

  constructor() {
    effect(() => {
      const id    = this.empId();
      const month = this.payrollMonth();
      this.cancelLoad$.next();
      if (id != null) {
        this.empOtSvc.getByEmployee(id, month)
          .pipe(takeUntil(this.cancelLoad$), takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next:  data  => this.records.set(data),
            error: err   => console.error('Failed to load employee overtime', err),
          });
      } else {
        this.records.set([]);
      }
    });
  }

  startEdit(index: number): void {
    this.editHoursCtrl.setValue(this.records()[index].hours);
    this.editHoursCtrl.markAsUntouched();
    this.editingIndex.set(index);
  }

  saveEdit(index: number): void {
    if (this.editHoursCtrl.invalid) { this.editHoursCtrl.markAsTouched(); return; }

    const record = this.records()[index];
    const newHours = Number(this.editHoursCtrl.value);

    const payload: EmployeeOvertimeRequest = {
      empId:        record.empId,
      overtimeId:   record.overtimeId,
      hours:        newHours,
      payrollMonth: record.payrollMonth,
      isProcessed:  record.isProcessed,
      createdBy:    1,   // TODO: replace with AuthService user id
      modifiedBy:   1,   // TODO: replace with AuthService user id
    };

    this.saving.set(true);
    this.empOtSvc.update(record.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this.records.update(list =>
            list.map((r, i) => i === index ? updated : r)
          );
          this.editingIndex.set(null);
          this.saving.set(false);
        },
        error: () => {
          this.snackBar.open('Failed to update overtime hours.', 'Close', { duration: 3000 });
          this.saving.set(false);
        },
      });
  }

  cancelEdit(): void {
    this.editingIndex.set(null);
  }
}
