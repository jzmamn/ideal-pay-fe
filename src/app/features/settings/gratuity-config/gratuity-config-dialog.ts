import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule }      from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule }     from '@angular/material/divider';
import { MatFormFieldModule }   from '@angular/material/form-field';
import { MatIconModule }        from '@angular/material/icon';
import { MatInputModule }       from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Observable } from 'rxjs';

import { FormulaDefinitionForm } from '../../../shared/components/formula-definition/formula-definition-form/formula-definition-form';
import { FormulaDefinitionFormValue } from '../../../shared/components/formula-definition/formula-definition.models';
import { GratuityConfigModel }   from './gratuity-config.model';
import { GratuityConfigService } from './gratuity-config.service';

@Component({
  selector: 'app-gratuity-config-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, ReactiveFormsModule,
    MatSlideToggleModule, MatDividerModule, FormulaDefinitionForm,
  ],
  host: { class: 'mat-dialog-host' },
  templateUrl: './gratuity-config-dialog.html',
  styleUrl:    './gratuity-config-dialog.scss',
})
export class GratuityConfigDialog {
  readonly row    = inject<GratuityConfigModel | null>(MAT_DIALOG_DATA);
  readonly isEdit = this.row != null;

  private readonly fb        = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<GratuityConfigDialog>);
  private readonly svc       = inject(GratuityConfigService);

  readonly form = this.fb.group({
    id:          [{ value: this.row?.id   ?? null, disabled: true }],
    code:        [{ value: this.row?.code ?? '',   disabled: true }],
    name:        [this.row?.name        ?? '', Validators.required],
    description: [this.row?.description ?? null as string | null],
    isActive:    [this.row?.isActive    ?? true],
  });

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
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v  = this.form.getRawValue();
    const fv = this.latestFormula();
    const dto = {
      name:           v.name!,
      description:    v.description ?? undefined,
      formula:        fv.expression || undefined,
      formulaEnabled: fv.isActive,
      isActive:       v.isActive!,
    };
    const req$: Observable<unknown> = this.isEdit
      ? this.svc.update(this.row!.id, dto)
      : this.svc.create(dto);
    req$.subscribe({
      next:  () => this.dialogRef.close(true),
      error: () => this.dialogRef.close(false),
    });
  }

  delete(): void {
    if (this.row?.id == null) return;
    this.svc.delete(this.row.id).subscribe({
      next:  () => this.dialogRef.close(true),
      error: () => this.dialogRef.close(false),
    });
  }
}
