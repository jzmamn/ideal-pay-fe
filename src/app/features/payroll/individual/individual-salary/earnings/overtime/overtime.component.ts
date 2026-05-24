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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { OvertimeService } from '../../../../../settings/overtime/overtime.service';

interface OvertimeItem {
  id: number;
  code: string;
  name: string;
  amount: number;
}

const MOCK_OVERTIME_TYPES: OvertimeItem[] = [
  { id: 1, code: 'OT-REG', name: 'Regular Overtime',  amount: 0 },
  { id: 2, code: 'OT-HOL', name: 'Holiday Overtime',  amount: 0 },
  { id: 3, code: 'OT-WKD', name: 'Weekend Overtime',  amount: 0 },
  { id: 4, code: 'OT-NGT', name: 'Night Shift Extra', amount: 0 },
];

@Component({
  selector: 'app-overtime',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, ReactiveFormsModule,
    MatButtonModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatTooltipModule,
  ],
  templateUrl: './overtime.component.html',
  styleUrl: './overtime.component.scss',
})
export class OvertimeComponent {
  private readonly overtimeSvc = inject(OvertimeService);
  private readonly destroyRef  = inject(DestroyRef);

  readonly items        = signal<OvertimeItem[]>([]);
  readonly editingIndex = signal<number | null>(null);

  readonly total = computed(() => this.items().reduce((s, i) => s + i.amount, 0));

  readonly editAmountCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(0)],
  });

  constructor() {
    this.overtimeSvc.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: types => {
          const active = types.filter(t => t.isActive);
          this.items.set(
            active.length
              ? active.map(t => ({ id: t.id, code: t.code, name: t.name, amount: 0 }))
              : MOCK_OVERTIME_TYPES,
          );
        },
        error: () => this.items.set(MOCK_OVERTIME_TYPES),
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
