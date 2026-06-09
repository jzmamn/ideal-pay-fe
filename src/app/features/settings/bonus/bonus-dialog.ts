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
import { BonusModel } from './bonus.model';
import { FormulaDefinitionForm } from '../../../shared/components/formula-definition/formula-definition-form/formula-definition-form';
import { FormulaDefinitionFormValue } from '../../../shared/components/formula-definition/formula-definition.models';

export interface BonusDialogData {
  row: BonusModel | null;
}

export type BonusDialogResult =
  | { action: 'create'; data: Omit<BonusModel, 'id' | 'code'> }
  | { action: 'update'; data: BonusModel }
  | { action: 'delete'; id: number };

@Component({
  selector: 'app-bonus-dialog',
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
  templateUrl: './bonus-dialog.html',
  styleUrl: './bonus-dialog.scss',
})
export class BonusDialog {
  private readonly data      = inject<BonusDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<BonusDialog, BonusDialogResult>>(MatDialogRef);
  private readonly fb        = inject(FormBuilder);

  readonly row    = this.data.row;
  readonly isEdit = this.row != null;

  readonly bonusForm = this.fb.group({
    id:            [{ value: this.row?.id   ?? null, disabled: true }],
    code:          [{ value: this.row?.code ?? '', disabled: true }],
    name:          [this.row?.name          ?? '', Validators.required],
    description:   [this.row?.description   ?? null as string | null],
    amount:        [this.row?.amount        ?? null as number | null, [Validators.required, Validators.min(0)]],
    isActive:      [this.row?.isActive      ?? true],
    isTaxable:     [this.row?.isTaxable     ?? false],
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
  }

  onFormulaSaveRequested(value: FormulaDefinitionFormValue): void {
    this.latestFormula.set(value);
    this.formulaExpression.set(value.expression);
    this.formulaIsActive.set(value.isActive);
  }

  onSave(): void {
    if (this.bonusForm.invalid) {
      this.bonusForm.markAllAsTouched();
      return;
    }

    const raw = this.bonusForm.getRawValue();
    const fv  = this.latestFormula();

    const base = {
      name:           raw.name!,
      description:    raw.description ?? null,
      amount:         raw.amount,
      isActive:       raw.isActive!,
      isTaxable:      raw.isTaxable!,
      liableForEpf:   raw.liableForEpf!,
      liableForEtf:   raw.liableForEtf!,
      liableForPaye:  raw.liableForPaye!,
      liableNoPay:    raw.liableNoPay!,
      formula:        fv.expression || undefined,
      formulaEnabled: fv.isActive,
    };

    if (this.isEdit) {
      this.dialogRef.close({
        action: 'update',
        data: new BonusModel(
          this.row!.id, this.row!.code, base.name, base.description, base.amount,
          base.isActive, base.isTaxable, base.liableForEpf, base.liableForEtf,
          base.liableForPaye, base.liableNoPay, base.formula, base.formulaEnabled,
        ),
      });
    } else {
      this.dialogRef.close({ action: 'create', data: base });
    }
  }

  onDelete(): void {
    this.dialogRef.close({ action: 'delete', id: this.row!.id });
  }
}
