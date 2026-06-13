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
import { NopayModel } from './nopay.model';
import { FormulaDefinitionForm } from '../../../shared/components/formula-definition/formula-definition-form/formula-definition-form';
import { FormulaDefinitionFormValue } from '../../../shared/components/formula-definition/formula-definition.models';

export interface NopayDialogData {
  row: NopayModel | null;
}

export type NopayDialogResult =
  | { action: 'create'; data: Omit<NopayModel, 'id'> }
  | { action: 'update'; data: NopayModel }
  | { action: 'delete'; id: number };

@Component({
  selector: 'app-nopay-dialog',
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
  templateUrl: './nopay-dialog.html',
  styleUrl: './nopay.scss',
})
export class NopayDialog {
  private readonly data      = inject<NopayDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject<MatDialogRef<NopayDialog, NopayDialogResult>>(MatDialogRef);
  private readonly fb        = inject(FormBuilder);

  readonly row    = this.data.row;
  readonly isEdit = this.row != null;

  readonly form = this.fb.group({
    id:            [{ value: this.row?.id   ?? null, disabled: true }],
    code:          [{ value: this.row?.code ?? '',   disabled: true }, Validators.required],
    name:          [this.row?.name           ?? '',  Validators.required],
    description:   [this.row?.description    ?? null as string | null],
    isActive:      [this.row?.isActive       ?? true],
    liableForEpf:  [this.row?.liableForEpf   ?? false],
    liableForEtf:  [this.row?.liableForEtf   ?? false],
    liableForPaye: [this.row?.liableForPaye  ?? false],
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
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const raw = this.form.getRawValue();
    const fv  = this.latestFormula();

    const base = {
      code:           raw.code!,
      name:           raw.name!,
      description:    raw.description,
      isActive:       raw.isActive!,
      liableForEpf:   raw.liableForEpf!,
      liableForEtf:   raw.liableForEtf!,
      liableForPaye:  raw.liableForPaye!,
      formula:        fv.expression || undefined,
      formulaEnabled: fv.isActive,
    };

    if (this.isEdit) {
      this.dialogRef.close({ action: 'update', data: { id: this.row!.id, ...base } });
    } else {
      this.dialogRef.close({ action: 'create', data: base });
    }
  }

  onDelete(): void {
    if (this.row?.id != null) {
      this.dialogRef.close({ action: 'delete', id: this.row.id });
    }
  }
}
