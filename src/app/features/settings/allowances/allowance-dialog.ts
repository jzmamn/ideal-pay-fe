import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
import { FormulaDefinitionForm } from '../../../shared/components/formula-definition/formula-definition-form/formula-definition-form';
import { FormulaDefinitionService } from '../../../shared/components/formula-definition/formula-definition.service';
import {
  FormulaDefinitionFormValue,
  FormulaDefinitionRequestDTO,
  FormulaType,
} from '../../../shared/components/formula-definition/formula-definition.models';

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
    FormulaDefinitionForm,
  ],
  host: { class: 'mat-dialog-host' },
  templateUrl: './allowance-dialog.html',
  styleUrl: './allowances.scss',
})
export class AllowanceDialog {
  private readonly data          = inject<AllowanceDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef     = inject<MatDialogRef<AllowanceDialog, AllowanceDialogResult>>(MatDialogRef);
  private readonly formulaService = inject(FormulaDefinitionService);

  readonly row         = this.data.row;
  readonly isEdit      = this.row != null;
  readonly isFixed     = this.data.allowanceType === AllowanceType.FIXED;
  readonly dialogTitle = this.isFixed ? 'Fixed Allowance' : 'Variable Allowance';
  readonly formulaType: FormulaType | null = this.isFixed ? null : 'VARIABLE_ALLOWANCE';

  private readonly fb = inject(FormBuilder);

  readonly allowanceForm = this.fb.group({
    id:            [{ value: this.row?.id   ?? null, disabled: true }],
    code:          [{ value: this.row?.code ?? '', disabled: true }, Validators.required],
    name:          [this.row?.name          ?? '', Validators.required],
    description:   [this.row?.description   ?? null as string | null],
    amount:        [this.row?.amount        ?? null as number | null, this.isFixed ? [Validators.required, Validators.min(0)] : []],
    isActive:      [this.row?.isActive      ?? true],
    isTaxable:     [this.row?.isTaxable     ?? false],
    liableForEpf:  [this.row?.liableForEpf  ?? false],
    liableForEtf:  [this.row?.liableForEtf  ?? false],
    liableForPaye: [this.row?.liableForPaye ?? false],
    liableNoPay:   [this.row?.liableNoPay   ?? false],
  });

  // ── Formula state ─────────────────────────────────────────────────────────
  readonly formulaId         = signal<number | null>(null);
  readonly formulaExpression = signal('');
  readonly formulaIsActive   = signal(true);
  readonly formulaSaving     = signal(false);
  readonly formulaSaveError  = signal<string | null>(null);

  constructor() {
    if (this.formulaType) {
      this.formulaService.getByType(this.formulaType).subscribe(f => {
        if (f) {
          this.formulaId.set(f.id);
          this.formulaExpression.set(f.expression);
          this.formulaIsActive.set(f.isActive);
        }
      });
    }
  }

  onFormulaSaveRequested(value: FormulaDefinitionFormValue): void {
    const type = this.formulaType!;
    const id   = this.formulaId();
    const payload: FormulaDefinitionRequestDTO = {
      formulaType: type,
      expression:  value.expression,
      isActive:    value.isActive,
      createdBy:   1,
      modifiedBy:  1,
    };
    this.formulaSaving.set(true);
    this.formulaSaveError.set(null);
    const req$ = id !== null
      ? this.formulaService.update(id, payload)
      : this.formulaService.create(payload);
    req$.subscribe({
      next: () => {
        this.formulaSaving.set(false);
        if (id === null) {
          this.formulaService.getByType(type).subscribe(f => {
            if (f) this.formulaId.set(f.id);
          });
        }
      },
      error: (err: unknown) => {
        this.formulaSaving.set(false);
        const msg = (err as { error?: { message?: string } })?.error?.message ?? 'Failed to save formula.';
        this.formulaSaveError.set(msg);
      },
    });
  }

  onSave(): void {
    if (this.allowanceForm.invalid) return;
    const raw  = this.allowanceForm.getRawValue();
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
