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
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmployeeProfileService } from '../employee-profile.service';
import { EmployeeFixedAllowanceResponse, EmployeeFixedAllowanceRequest } from './employee-fixed-allowance.model';

@Component({
  selector: 'app-employee-allowances',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
  ],
  templateUrl: './employee-fixed-allowance.component.html',
  styleUrl: './employee-fixed-allowance.component.scss',
})
export class EmployeeAllowances {
  private readonly profileSvc = inject(EmployeeProfileService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar   = inject(MatSnackBar);

  readonly empId = input<number | null>(null);

  readonly allowances  = signal<EmployeeFixedAllowanceResponse[]>([]);
  readonly editingIndex = signal<number | null>(null);
  readonly saving       = signal(false);

  readonly totalFixedAllowance = computed(() =>
    this.allowances().reduce((sum, a) => sum + a.amount, 0)
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
          .subscribe(profile => this.allowances.set(profile.fixedAllowances));
      } else {
        this.allowances.set([]);
      }
    });
  }

  startEdit(index: number): void {
    this.editAmountCtrl.setValue(this.allowances()[index].amount);
    this.editAmountCtrl.markAsUntouched();
    this.editingIndex.set(index);
  }

  saveEdit(index: number): void {
    if (this.editAmountCtrl.invalid) {
      this.editAmountCtrl.markAsTouched();
      return;
    }
    const record = this.allowances()[index];
    const newAmount = Number(this.editAmountCtrl.value);
    const payload: EmployeeFixedAllowanceRequest = {
      empId:        record.empId,
      faId:         record.faId,
      amount:       newAmount,
      payrollMonth: record.payrollMonth,
      isProcessed:  record.isProcessed,
      processedDate: record.processedDate,
      createdBy:    1,
      modifiedBy:   1,
    };

    this.saving.set(true);
    this.profileSvc.updateFixedAllowance(record.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this.allowances.update(list =>
            list.map((a, i) => i === index ? updated : a)
          );
          this.editingIndex.set(null);
          this.saving.set(false);
        },
        error: () => {
          this.snackBar.open('Failed to update allowance.', 'Close', { duration: 3000 });
          this.saving.set(false);
        },
      });
  }

  cancelEdit(): void {
    this.editingIndex.set(null);
  }
}
