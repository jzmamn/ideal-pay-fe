import {
  ChangeDetectionStrategy, Component, DestroyRef,
  computed, inject, signal,
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
import { VariableDeductionService } from '../../../../settings/deduction/variable-deduction.service';

interface VariableDeductionItem {
  id: number;
  code: string;
  name: string;
  amount: number;
}

@Component({
  selector: 'app-variable-deduction',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, ReactiveFormsModule,
    MatButtonModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatTooltipModule,
  ],
  templateUrl: './variable-deduction.component.html',
  styleUrl: './variable-deduction.component.scss',
})
export class VariableDeductionComponent {
  private readonly svc        = inject(VariableDeductionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly items        = signal<VariableDeductionItem[]>([]);
  readonly editingIndex = signal<number | null>(null);

  readonly total = computed(() => this.items().reduce((s, i) => s + i.amount, 0));

  readonly editAmountCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(0)],
  });

  constructor() {
    this.svc.getAll().pipe(
      takeUntilDestroyed(this.destroyRef),
      map(list =>
        list
          .filter(d => d.isActive)
          .map(d => ({ id: d.id, code: d.code, name: d.name, amount: d.amount ?? 0 }))
      ),
    ).subscribe(items => this.items.set(items));
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
