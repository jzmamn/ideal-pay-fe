import {
  ChangeDetectionStrategy, Component, ElementRef,
  computed, input, output, signal, viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface PivotRow {
  emp: { id: number; code: string; name: string };
  idx: number;
}

export interface PivotAmountChange {
  code: string;
  empIndex: number;
  amount: number;
}

@Component({
  selector: 'app-pivot',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, ReactiveFormsModule,
    MatButtonModule, MatIconModule,
  ],
  templateUrl: './pivot.html',
  styleUrl: './pivot.scss',
})
export class PivotComponent {
  readonly codes    = input.required<readonly string[]>();
  readonly rows     = input.required<PivotRow[]>();
  readonly amounts  = input.required<Record<string, number[]>>();
  readonly label    = input('');
  /** When true, cells are read-only — no click-to-edit behaviour. */
  readonly readOnly = input(false);

  readonly amountChange  = output<PivotAmountChange>();
  readonly importClick   = output<void>();
  readonly exportClick   = output<void>();

  readonly empFilter = signal('');

  readonly filteredRows = computed(() => {
    const q = this.empFilter().trim().toLowerCase();
    return q
      ? this.rows().filter(({ emp }) =>
          emp.code.toLowerCase().includes(q) || emp.name.toLowerCase().includes(q))
      : this.rows();
  });

  readonly categoryTotal = computed(() =>
    this.codes().reduce((sum, code) => sum + this.getColTotal(code), 0)
  );

  readonly editingCell = signal<{ empIndex: number; code: string } | null>(null);
  readonly editCtrl    = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(0)],
  });

  private readonly _editInput = viewChild<ElementRef<HTMLInputElement>>('editInputEl');

  getAmount(code: string, empIndex: number): number {
    return this.amounts()[code]?.[empIndex] ?? 0;
  }

  getColTotal(code: string): number {
    return (this.amounts()[code] ?? []).reduce((s, v) => s + v, 0);
  }

  isEditing(empIndex: number, code: string): boolean {
    const c = this.editingCell();
    return c?.empIndex === empIndex && c?.code === code;
  }

  startCellEdit(empIndex: number, code: string): void {
    if (this.editingCell()) this.saveCellEdit();
    this.editCtrl.setValue(this.getAmount(code, empIndex));
    this.editingCell.set({ empIndex, code });
    queueMicrotask(() => this._editInput()?.nativeElement.focus());
  }

  saveCellEdit(): void {
    const cell = this.editingCell();
    if (!cell) return;
    const amount = Math.max(0, Number(this.editCtrl.value ?? 0));
    this.amountChange.emit({ code: cell.code, empIndex: cell.empIndex, amount });
    this.editingCell.set(null);
  }

  cancelCellEdit(): void { this.editingCell.set(null); }

  clearFilter(): void { this.empFilter.set(''); }
}
