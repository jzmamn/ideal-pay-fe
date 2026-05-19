import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  output,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FixedDeductionService } from '../../deduction/fixed-deduction.service';

export interface FixedDeduction {
  id: number;
  code: string;
  name: string;
  amount: number;
}

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
  templateUrl: './employee-deductions.component.html',
  styleUrl: './employee-deductions.component.scss',
})
export class EmployeeDeductions {
  private readonly fixedDeductionSvc = inject(FixedDeductionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedDeductions = signal<FixedDeduction[]>([]);
  readonly editingIndex = signal<number | null>(null);

  readonly totalFixedDeduction = computed(() =>
    this.selectedDeductions().reduce((sum, d) => sum + d.amount, 0)
  );

  readonly deductionsChange = output<FixedDeduction[]>();

  readonly editAmountCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(0)],
  });

  constructor() {
    effect(() => this.deductionsChange.emit(this.selectedDeductions()));

    this.fixedDeductionSvc.getAll().pipe(
      takeUntilDestroyed(this.destroyRef),
      map(list =>
        list
          .filter(d => d.isActive)
          .map(d => ({
            id: d.id,
            code: d.code,
            name: d.name,
            amount: d.amount ?? 0,
          }))
      ),
    ).subscribe(deductions => this.selectedDeductions.set(deductions));
  }

  startEdit(index: number): void {
    this.editAmountCtrl.setValue(this.selectedDeductions()[index].amount);
    this.editAmountCtrl.markAsUntouched();
    this.editingIndex.set(index);
  }

  saveEdit(index: number): void {
    if (this.editAmountCtrl.invalid) {
      this.editAmountCtrl.markAsTouched();
      return;
    }
    const newAmount = Number(this.editAmountCtrl.value);
    this.selectedDeductions.update(list =>
      list.map((d, i) => i === index ? { ...d, amount: newAmount } : d)
    );
    this.editingIndex.set(null);
  }

  cancelEdit(): void {
    this.editingIndex.set(null);
  }
}
