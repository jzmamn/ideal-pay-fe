import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { NoPayDays } from '../../../shared/models/master-data.models';
import { MasterDataService } from '../../../shared/services/master-data.service';
import { FormulaDefinitionForm } from '../../../shared/components/formula-definition/formula-definition-form/formula-definition-form';
import { FormulaDefinitionFormValue } from '../../../shared/components/formula-definition/formula-definition.models';

@Component({
  selector: 'app-nopay-days-dialog',
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
  templateUrl: './nopay-days-dialog.html',
  styleUrl: './nopay-days-dialog.scss',
})
export class NopayDaysDialog {
  readonly item   = inject<NoPayDays | null>(MAT_DIALOG_DATA);
  readonly isEdit = this.item != null;

  private readonly fb        = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<NopayDaysDialog>);
  private readonly masterSvc = inject(MasterDataService);

  readonly form = this.fb.group({
    id:          [{ value: this.item?.id   ?? null, disabled: true }],
    code:        [{ value: this.item?.code ?? '',   disabled: true }, Validators.required],
    name:        [this.item?.name        ?? '',     Validators.required],
    days:        [this.item?.days        ?? null as number | null, [Validators.required, Validators.min(0)]],
    description: [this.item?.description ?? null as string | null],
    isActive:    [this.item?.isActive    ?? true],
  });

  // ── Formula state ──────────────────────────────────────────────────────────
  readonly formulaExpression = signal(this.item?.formula        ?? '');
  readonly formulaIsActive   = signal(this.item?.formulaEnabled ?? false);
  readonly formulaSaving     = signal(false);
  readonly formulaSaveError  = signal<string | null>(null);

  private readonly latestFormula = signal<FormulaDefinitionFormValue>({
    expression: this.item?.formula        ?? '',
    isActive:   this.item?.formulaEnabled ?? false,
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

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v  = this.form.getRawValue();
    const fv = this.latestFormula();
    const dto = {
      code:           v.code!,
      name:           v.name!,
      days:           v.days!,
      description:    v.description ?? undefined,
      isActive:       v.isActive!,
      formula:        fv.expression || undefined,
      formulaEnabled: fv.isActive,
    };
    if (this.isEdit) {
      this.masterSvc.updateMaster('nopay', v.id!, dto).subscribe({
        next: () => { this.masterSvc.reload('nopay'); this.dialogRef.close(true); },
        error: () => this.dialogRef.close(false),
      });
    } else {
      this.masterSvc.createMaster('nopay', dto).subscribe({
        next: () => { this.masterSvc.reload('nopay'); this.dialogRef.close(true); },
        error: () => this.dialogRef.close(false),
      });
    }
  }

  delete(): void {
    const id = this.item?.id;
    if (id == null) return;
    this.masterSvc.deleteMaster('nopay', id).subscribe({
      next: () => { this.masterSvc.reload('nopay'); this.dialogRef.close(true); },
      error: () => this.dialogRef.close(false),
    });
  }
}
