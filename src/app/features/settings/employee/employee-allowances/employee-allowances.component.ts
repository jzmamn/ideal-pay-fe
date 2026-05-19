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
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FixedAllowanceService } from '../../allowances/fixed-allowance.service';

export interface FixedAllowance {
  id: number;
  code: string;
  name: string;
  amount: number;
}

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
  templateUrl: './employee-allowances.component.html',
  styleUrl: './employee-allowances.component.scss',
})
export class EmployeeAllowances {
  private readonly fixedAllowanceSvc = inject(FixedAllowanceService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedAllowances = signal<FixedAllowance[]>([]);
  readonly editingIndex = signal<number | null>(null);

  readonly totalFixedAllowance = computed(() =>
    this.selectedAllowances().reduce((sum, a) => sum + a.amount, 0)
  );

  readonly allowancesChange = output<FixedAllowance[]>();

  readonly editAmountCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(0)],
  });

  constructor() {
    effect(() => this.allowancesChange.emit(this.selectedAllowances()));

    this.fixedAllowanceSvc.getAll().pipe(
      takeUntilDestroyed(this.destroyRef),
      map(list =>
        list
          .filter(a => a.isActive)
          .map(a => ({
            id: a.id,
            code: a.code,
            name: a.name,
            amount: a.amount ?? 0,
          }))
      ),
    ).subscribe(allowances => this.selectedAllowances.set(allowances));
  }

  startEdit(index: number): void {
    this.editAmountCtrl.setValue(this.selectedAllowances()[index].amount);
    this.editAmountCtrl.markAsUntouched();
    this.editingIndex.set(index);
  }

  saveEdit(index: number): void {
    if (this.editAmountCtrl.invalid) {
      this.editAmountCtrl.markAsTouched();
      return;
    }
    const newAmount = Number(this.editAmountCtrl.value);
    this.selectedAllowances.update(list =>
      list.map((a, i) => i === index ? { ...a, amount: newAmount } : a)
    );
    this.editingIndex.set(null);
  }

  cancelEdit(): void {
    this.editingIndex.set(null);
  }

}
