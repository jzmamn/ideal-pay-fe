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
import { AllowanceModel } from './allowance.model';
import { AllowanceType } from './allowance.types';

export interface AllowanceDialogData {
  row: AllowanceModel | null;
  allowanceType: AllowanceType;
}

export type AllowanceDialogResult =
  | { action: 'create'; data: Omit<AllowanceModel, 'id' | 'type'> }
  | { action: 'update'; data: Omit<AllowanceModel, 'type'> }
  | { action: 'delete'; id: number };

@Component({
  selector: 'app-allowance-dialog',
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
  templateUrl: './allowance-dialog.html',
  styleUrl: './allowances.scss',
})
export class AllowanceDialog {
  private readonly data = inject<AllowanceDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<AllowanceDialog, AllowanceDialogResult>>(MatDialogRef);

  readonly row = this.data.row;
  readonly isEdit = this.row != null;
  readonly isFixed = this.data.allowanceType === AllowanceType.FIXED;
  readonly dialogTitle = this.isFixed ? 'Fixed Allowance' : 'Variable Allowance';

  private readonly fb = inject(FormBuilder);

  readonly allowanceForm = this.fb.group({
    id:           [{ value: this.row?.id   ?? null, disabled: true }],
    code:         [{ value: this.row?.code ?? '', disabled: this.isEdit }, Validators.required],
    name:         [this.row?.name          ?? '', Validators.required],
    description:  [this.row?.description   ?? null as string | null],
    amount:       [this.row?.amount        ?? null as number | null, this.isFixed ? [Validators.required, Validators.min(0)] : []],
    isActive:     [this.row?.isActive      ?? true],
    isTaxable:    [this.row?.isTaxable     ?? false],
    liableForEpf: [this.row?.liableForEpf  ?? false],
    liableForEtf: [this.row?.liableForEtf  ?? false],
    liableForPaye:[this.row?.liableForPaye ?? false],
    liableNoPay:  [this.row?.liableNoPay   ?? false],
  });

  onSave(): void {
    if (this.allowanceForm.invalid) return;
    const raw = this.allowanceForm.getRawValue();
    const base = {
      code:          raw.code!,
      name:          raw.name!,
      description:   raw.description,
      amount:        this.isFixed ? raw.amount! : undefined,
      isActive:      raw.isActive!,
      isTaxable:     raw.isTaxable!,
      liableForEpf:  raw.liableForEpf!,
      liableForEtf:  raw.liableForEtf!,
      liableForPaye: raw.liableForPaye!,
      liableNoPay:   raw.liableNoPay!,
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
