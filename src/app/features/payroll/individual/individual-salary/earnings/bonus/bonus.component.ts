import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
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
import { EmployeeBonusResponse, EmployeeBonusRequest } from './employee-bonus.model';
import { EmployeeBonusService } from './employee-bonus.service';

@Component({
  selector: 'app-bonus',
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
  templateUrl: './bonus.component.html',
  styleUrl: './bonus.component.scss',
})
export class BonusComponent {
  private readonly bonusSvc  = inject(EmployeeBonusService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar   = inject(MatSnackBar);

  readonly empId = input<number | null>(null);

  readonly bonuses      = signal<EmployeeBonusResponse[]>([]);
  readonly editingIndex = signal<number | null>(null);
  readonly saving       = signal(false);

  readonly total = computed(() =>
    this.bonuses().reduce((sum, b) => sum + b.amount, 0)
  );

  readonly editAmountCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(0)],
  });

  constructor() {
    effect(() => {
      const id = this.empId();
      if (id != null) {
        this.bonusSvc.getByEmployee(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: data => this.bonuses.set(data),
            error: err => console.error('Failed to load employee bonuses', err),
          });
      } else {
        this.bonuses.set([]);
      }
    });
  }

  startEdit(index: number): void {
    this.editAmountCtrl.setValue(this.bonuses()[index].amount);
    this.editAmountCtrl.markAsUntouched();
    this.editingIndex.set(index);
  }

  saveEdit(index: number): void {
    if (this.editAmountCtrl.invalid) {
      this.editAmountCtrl.markAsTouched();
      return;
    }
    const record    = this.bonuses()[index];
    const newAmount = Number(this.editAmountCtrl.value);

    const payload: EmployeeBonusRequest = {
      empId:        record.empId,
      bonusId:      record.bonusId,
      amount:       newAmount,
      payrollMonth: record.payrollMonth,
      isProcessed:  record.isProcessed,
      processedDate: record.processedDate,
      createdBy:    1,
      modifiedBy:   1,
    };

    this.saving.set(true);
    this.bonusSvc.update(record.id, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this.bonuses.update(list =>
            list.map((b, i) => i === index ? updated : b)
          );
          this.editingIndex.set(null);
          this.saving.set(false);
        },
        error: () => {
          this.snackBar.open('Failed to update bonus.', 'Close', { duration: 3000 });
          this.saving.set(false);
        },
      });
  }

  cancelEdit(): void {
    this.editingIndex.set(null);
  }
}
