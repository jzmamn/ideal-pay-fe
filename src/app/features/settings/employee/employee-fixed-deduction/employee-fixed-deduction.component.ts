import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmployeeProfileService } from '../employee-profile.service';
import { EmployeeFixedDeductionResponse, EmployeeFixedDeductionRequest } from './employee-fixed-deduction.model';

@Component({
  selector: 'app-employee-deductions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
  ],
  templateUrl: './employee-fixed-deduction.component.html',
  styleUrl: './employee-fixed-deduction.component.scss',
})
export class EmployeeDeductions {
  private readonly profileSvc = inject(EmployeeProfileService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar   = inject(MatSnackBar);

  readonly empId = input<number | null>(null);

  readonly deductions  = signal<EmployeeFixedDeductionResponse[]>([]);
  readonly editingIndex = signal<number | null>(null);
  readonly saving       = signal(false);

  readonly totalFixedDeduction = computed(() =>
    this.deductions().reduce((sum, d) => sum + d.amount, 0)
  );

  readonly editAmountCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(0)],
  });

  constructor() {
    effect(() => {
      const id = this.empId();
      if (id != null) {
        this.profileSvc.getEmployeeProfileByEmployee(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(profile => this.deductions.set(profile.fixedDeductions));
      } else {
        this.deductions.set([]);
      }
    });
  }

  startEdit(index: number): void {
    this.editAmountCtrl.setValue(this.deductions()[index].amount);
    this.editAmountCtrl.markAsUntouched();
    this.editingIndex.set(index);
  }

  saveEdit(index: number): void {
    if (this.editAmountCtrl.invalid) {
      this.editAmountCtrl.markAsTouched();
      return;
    }
    const record = this.deductions()[index];
    const newAmount = Number(this.editAmountCtrl.value);
    const payload: EmployeeFixedDeductionRequest = {
      empId:        record.empId,
      fdId:         record.fdId,
      amount:       newAmount,
      payrollMonth: record.payrollMonth,
      isProcessed:  record.isProcessed,
      processedDate: record.processedDate,
      createdBy:    1,
      modifiedBy:   1,
    };

    this.saving.set(true);
    this.profileSvc.updateFixedDeduction(record.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this.deductions.update(list =>
            list.map((d, i) => i === index ? updated : d)
          );
          this.editingIndex.set(null);
          this.saving.set(false);
        },
        error: () => {
          this.snackBar.open('Failed to update deduction.', 'Close', { duration: 3000 });
          this.saving.set(false);
        },
      });
  }

  cancelEdit(): void {
    this.editingIndex.set(null);
  }
}
