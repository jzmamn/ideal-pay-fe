import {
  ChangeDetectionStrategy, Component, DestroyRef,
  computed, inject, signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { PayrollPrepareService } from '../../shared/payroll-prepare.service';

interface VariableAllowanceItem {
  id: number;
  code: string;
  name: string;
  amount: number;
}

@Component({
  selector: 'app-variable-allowance',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, ReactiveFormsModule,
    MatButtonModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatTooltipModule,
  ],
  templateUrl: './variable-allowance.component.html',
  styleUrl: './variable-allowance.component.scss',
})
export class VariableAllowanceComponent {
  private readonly svc        = inject(PayrollPrepareService);
  private readonly destroyRef = inject(DestroyRef);

  readonly items        = signal<VariableAllowanceItem[]>([]);
  readonly editingIndex = signal<number | null>(null);

  readonly total = computed(() => this.items().reduce((s, i) => s + i.amount, 0));

  readonly editAmountCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(0)],
  });

  constructor() {
    toObservable(this.svc.entries)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(entries => {
        if (entries.length) {
          this.items.set(entries.map(e => ({ id: e.id, code: e.empCode, name: e.fullName, amount: 0 })));
        }
      });
  }

  startEdit(index: number): void {
    this.editAmountCtrl.setValue(this.items()[index].amount);
    this.editAmountCtrl.markAsUntouched();
    this.editingIndex.set(index);
  }

  saveEdit(index: number): void {
    if (this.editAmountCtrl.invalid) { this.editAmountCtrl.markAsTouched(); return; }
    this.items.update(list =>
      list.map((item, i) => i === index ? { ...item, amount: Number(this.editAmountCtrl.value) } : item)
    );
    this.editingIndex.set(null);
  }

  cancelEdit(): void { this.editingIndex.set(null); }
}

