import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Observable } from 'rxjs';
import { FormulaDefinitionForm } from '../../../shared/components/formula-definition/formula-definition-form/formula-definition-form';
import { FormulaDefinitionFormValue } from '../../../shared/components/formula-definition/formula-definition.models';
import { OvertimeModel } from './overtime.model';
import { OvertimeService } from './overtime.service';

@Component({
  selector: 'app-overtime-dialog',
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
    FormulaDefinitionForm,
  ],
  host: { class: 'mat-dialog-host' },
  templateUrl: './overtime-dialog.html',
  styleUrl: './overtime.scss',
})
export class OvertimeDialog {
  readonly row    = inject<OvertimeModel | null>(MAT_DIALOG_DATA);
  readonly isEdit = this.row != null;

  private readonly fb          = inject(FormBuilder);
  private readonly dialogRef   = inject(MatDialogRef<OvertimeDialog>);
  private readonly overtimeSvc = inject(OvertimeService);

  readonly overtimeForm = this.fb.group({
    id:          [{ value: this.row?.id ?? null, disabled: true }],
    code:        [{ value: this.row?.code ?? '', disabled: true }],
    name:        [this.row?.name        ?? '', Validators.required],
    description: [this.row?.description ?? null as string | null],
    isActive:    [this.row?.isActive    ?? true],
  });

  // ── Formula panel state ───────────────────────────────────────────────────
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

  save(): void {
    if (this.overtimeForm.invalid) { this.overtimeForm.markAllAsTouched(); return; }
    const v  = this.overtimeForm.getRawValue();
    const fv = this.latestFormula();
    const dto = {
      name:           v.name!,
      description:    v.description ?? undefined,
      isActive:       v.isActive!,
      formula:        fv.expression || undefined,
      formulaEnabled: fv.isActive,
    };
    const req$: Observable<unknown> = this.isEdit
      ? this.overtimeSvc.update(this.row!.id, dto)
      : this.overtimeSvc.create(dto);
    req$.subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.dialogRef.close(false),
    });
  }

  delete(): void {
    if (this.row?.id == null) return;
    this.overtimeSvc.delete(this.row.id).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.dialogRef.close(false),
    });
  }
}
