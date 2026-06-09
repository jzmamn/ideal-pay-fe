import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Observable } from 'rxjs';
import { FormulaDefinitionForm } from '../../../shared/components/formula-definition/formula-definition-form/formula-definition-form';
import { FormulaDefinitionFormValue } from '../../../shared/components/formula-definition/formula-definition.models';
import { LateDeductionConfigModel } from './late-deduction-config.model';
import { LateDeductionConfigService } from './late-deduction-config.service';

@Component({
  selector: 'app-late-deduction-config-dialog',
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
  templateUrl: './late-deduction-config-dialog.html',
  styleUrl:    './late-deduction-config.scss',
})
export class LateDeductionConfigDialog {
  readonly row    = inject<LateDeductionConfigModel | null>(MAT_DIALOG_DATA);
  readonly isEdit = this.row != null;

  private readonly fb         = inject(FormBuilder);
  private readonly dialogRef  = inject(MatDialogRef<LateDeductionConfigDialog>);
  private readonly configSvc  = inject(LateDeductionConfigService);

  readonly form = this.fb.group({
    id:                 [{ value: this.row?.id   ?? null, disabled: true }],
    code:               [{ value: this.row?.code ?? '',   disabled: true }],
    name:               [this.row?.name               ?? '',  Validators.required],
    description:        [this.row?.description        ?? null as string | null],
    workingDays:        [this.row?.workingDays         ?? 26,
                          [Validators.required, Validators.min(1), Validators.max(31)]],
    workingHoursPerDay: [this.row?.workingHoursPerDay  ?? 8,
                          [Validators.required, Validators.min(1), Validators.max(24)]],
    isActive:           [this.row?.isActive ?? true],
  });

  // ── Formula panel ─────────────────────────────────────────────────────────
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

  // ── Actions ───────────────────────────────────────────────────────────────

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v  = this.form.getRawValue();
    const fv = this.latestFormula();
    const dto = {
      name:               v.name!,
      description:        v.description ?? undefined,
      workingDays:        v.workingDays!,
      workingHoursPerDay: v.workingHoursPerDay!,
      isActive:           v.isActive!,
      formula:            fv.expression || undefined,
      formulaEnabled:     fv.isActive,
    };
    const req$: Observable<unknown> = this.isEdit
      ? this.configSvc.update(this.row!.id, dto)
      : this.configSvc.create(dto);
    req$.subscribe({
      next:  () => this.dialogRef.close(true),
      error: () => this.dialogRef.close(false),
    });
  }

  delete(): void {
    if (this.row?.id == null) return;
    this.configSvc.delete(this.row.id).subscribe({
      next:  () => this.dialogRef.close(true),
      error: () => this.dialogRef.close(false),
    });
  }
}
