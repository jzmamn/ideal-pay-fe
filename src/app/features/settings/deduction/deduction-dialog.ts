import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
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
import { FormulaDefinitionForm } from '../../../shared/components/formula-definition/formula-definition-form/formula-definition-form';
import { FormulaDefinitionFormValue } from '../../../shared/components/formula-definition/formula-definition.models';

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
    FormulaDefinitionForm,
    CdkTextareaAutosize,
  ],
  host: { class: 'mat-dialog-host' },
  templateUrl: './deduction-dialog.html',
  styleUrl: './deduction.scss',
})
export class DeductionDialog {
  private readonly data      = inject<DeductionDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<DeductionDialog, DeductionDialogResult>>(MatDialogRef);

  readonly row         = this.data.row;
  readonly isEdit      = this.row != null;
  readonly isFixed     = this.data.deductionType === DeductionType.FIXED;
  readonly dialogTitle = this.isFixed ? 'Fixed Deduction' : 'Variable Deduction';

  private readonly fb = inject(FormBuilder);

  readonly deductionForm = this.fb.group({
    id:             [{ value: this.row?.id ?? null, disabled: true }],
    code:           [{ value: this.row?.code ?? '', disabled: true }, Validators.required],
    name:           [this.row?.name           ?? '', Validators.required],
    description:    [this.row?.description    ?? null as string | null],
    isActive:       [this.row?.isActive       ?? true],
    liableForEpf:  [this.row?.liableForEpf  ?? false],
    liableForEtf:  [this.row?.liableForEtf  ?? false],
    liableForPaye: [this.row?.liableForPaye ?? false],
    liableNoPay:   [this.row?.liableNoPay   ?? false],
  });

  // ── Formula state ─────────────────────────────────────────────────────────
  readonly formulaExpression = signal(this.row?.formula        ?? '');
  readonly formulaIsActive   = signal(this.row?.formulaEnabled ?? false);
  readonly formulaSaving     = signal(false);
  readonly formulaSaveError  = signal<string | null>(null);

  private readonly latestFormula = signal<FormulaDefinitionFormValue>({
    expression: this.row?.formula        ?? '',
    isActive:   this.row?.formulaEnabled ?? false,
  });

  onFormulaValueChanged(value: FormulaDefinitionFormValue): void {
    this.latestFormula.set(value);
    this.formulaIsActive.set(value.isActive);
  }

  onFormulaSaveRequested(value: FormulaDefinitionFormValue): void {
    this.latestFormula.set(value);
    this.formulaExpression.set(value.expression);
    this.formulaIsActive.set(value.isActive);
  }

  onSave(): void {
    if (this.deductionForm.invalid) return;
    const raw  = this.deductionForm.getRawValue();
    const fv   = this.latestFormula();
    const base = {
      code:           raw.code!,
      name:           raw.name!,
      description:    raw.description,
      isActive:       raw.isActive!,
      liableForEpf:  raw.liableForEpf!,
      liableForEtf:  raw.liableForEtf!,
      liableForPaye: raw.liableForPaye!,
      liableNoPay:   raw.liableNoPay!,
      formula:        this.isFixed ? (fv.expression || undefined) : undefined,
      formulaEnabled: this.isFixed ? fv.isActive : false,
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
