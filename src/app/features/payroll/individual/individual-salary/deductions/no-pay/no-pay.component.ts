import {
  ChangeDetectionStrategy, Component,
  computed, effect, inject, signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IndividualSalaryService } from '../../shared/individual-salary.service';

interface NoPayItem {
  id: number;
  code: string;
  name: string;
  amount: number;
}

@Component({
  selector: 'app-no-pay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, ReactiveFormsModule,
    MatButtonModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatTooltipModule,
  ],
  templateUrl: './no-pay.component.html',
  styleUrl: './no-pay.component.scss',
})
export class NoPayComponent {
  private readonly svc = inject(IndividualSalaryService);

  readonly items        = signal<NoPayItem[]>([]);
  readonly editingIndex = signal<number | null>(null);

  readonly total = computed(() => this.items().reduce((s, i) => s + i.amount, 0));

  readonly editAmountCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(0)],
  });

  constructor() {
    effect(() => {
      const entries = this.svc.entries();
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
