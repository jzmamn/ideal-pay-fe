import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DeductionModel } from './deduction.model';
import { DeductionType } from './deduction.types';

export interface DeductionDialogData {
  row: DeductionModel | null;
  deductionType: DeductionType;
}

export type DeductionDialogResult =
  | { action: 'create'; data: Omit<DeductionModel, 'id' | 'type'> }
  | { action: 'update'; data: Omit<DeductionModel, 'type'> }
  | { action: 'delete'; id: number };

@Component({
  selector: 'app-deduction-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatDividerModule,
    MatCheckboxModule,
  ],
  host: { class: 'mat-dialog-host' },
  templateUrl: './deduction-dialog.html',
  styleUrl: './deduction.scss',
})
export class DeductionDialog {
  private readonly data = inject<DeductionDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<DeductionDialog, DeductionDialogResult>>(MatDialogRef);

  readonly row = this.data.row;
  readonly isEdit = this.row != null;
  readonly isFixed = this.data.deductionType === DeductionType.FIXED;
  readonly dialogTitle = this.isFixed ? 'Fixed Deduction' : 'Variable Deduction';

  private readonly fb = inject(FormBuilder);

  readonly deductionForm = this.fb.group({
    id:             [{ value: this.row?.id ?? null, disabled: true }],
    code:           [this.row?.code           ?? '', Validators.required],
    name:           [this.row?.name           ?? '', Validators.required],
    amount:         [this.row?.amount         ?? null as number | null, this.isFixed ? [Validators.required, Validators.min(0)] : []],
    isActive:       [this.row?.isActive       ?? true],
    liableForEPF:   [this.row?.liableForEPF   ?? false],
    liableForETF:   [this.row?.liableForETF   ?? false],
    liableForNopay: [this.row?.liableForNopay ?? false],
  });

  onSave(): void {
    if (this.deductionForm.invalid) return;
    const raw = this.deductionForm.getRawValue();
    const base = {
      code:           raw.code!,
      name:           raw.name!,
      amount:         this.isFixed ? raw.amount! : undefined,
      isActive:       raw.isActive!,
      liableForEPF:   raw.liableForEPF!,
      liableForETF:   raw.liableForETF!,
      liableForNopay: raw.liableForNopay!,
    };
    if (this.isEdit) {
      this.dialogRef.close({ action: 'update', data: { id: this.row!.id, ...base } });
    } else {
      this.dialogRef.close({ action: 'create', data: base });
    }
  }

  onDelete(): void {
    this.dialogRef.close({ action: 'delete', id: this.row!.id });
  }
}
