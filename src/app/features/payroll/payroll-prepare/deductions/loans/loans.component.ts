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

interface LoanItem {
  id: number;
  code: string;
  purpose: string;
  outstanding: number;
  amount: number;
}

const MOCK_LOANS: LoanItem[] = [
  { id: 1, code: 'LN001', purpose: 'Vehicle Loan',   outstanding: 480000, amount: 20000 },
  { id: 2, code: 'LN002', purpose: 'Personal Loan',  outstanding: 150000, amount: 12500 },
  { id: 3, code: 'LN003', purpose: 'Housing Loan',   outstanding: 950000, amount: 35000 },
  { id: 4, code: 'LN004', purpose: 'Education Loan', outstanding:  80000, amount:  8000 },
];

@Component({
  selector: 'app-loans',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, ReactiveFormsModule,
    MatButtonModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatTooltipModule,
  ],
  templateUrl: './loans.component.html',
  styleUrl: './loans.component.scss',
})
export class LoansComponent {
  readonly items        = signal<LoanItem[]>(MOCK_LOANS);
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
