import {
  ChangeDetectionStrategy, Component,
  computed, signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

interface BonusItem {
  id: number;
  code: string;
  name: string;
  amount: number;
}

const BONUS_TYPES: BonusItem[] = [
  { id: 1, code: 'BON-PER', name: 'Performance Bonus', amount: 0 },
  { id: 2, code: 'BON-FES', name: 'Festival Bonus',    amount: 0 },
  { id: 3, code: 'BON-ANN', name: 'Annual Bonus',      amount: 0 },
  { id: 4, code: 'BON-REF', name: 'Referral Bonus',    amount: 0 },
];

@Component({
  selector: 'app-bonus',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, ReactiveFormsModule,
    MatButtonModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatTooltipModule,
  ],
  templateUrl: './bonus.component.html',
  styleUrl: './bonus.component.scss',
})
export class BonusComponent {
  readonly items        = signal<BonusItem[]>(BONUS_TYPES.map(b => ({ ...b })));
  readonly editingIndex = signal<number | null>(null);

  readonly total = computed(() => this.items().reduce((s, i) => s + i.amount, 0));

  readonly editAmountCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(0)],
  });

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
