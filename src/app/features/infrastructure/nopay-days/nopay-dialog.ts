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
import { FormulaDefinitionService } from '../../../shared/components/formula-definition/formula-definition.service';
import {
  FormulaDefinitionFormValue,
  FormulaDefinitionRequestDTO,
} from '../../../shared/components/formula-definition/formula-definition.models';

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
    FormulaDefinitionForm,
  ],
  host: { class: 'mat-dialog-host' },
  templateUrl: './nopay-dialog.html',
  styleUrl: './nopay-dialog.scss',
})
export class NopayDialog {
  readonly item = inject<NoPayDays | null>(MAT_DIALOG_DATA);
  readonly isEdit = this.item != null;

  private readonly fb             = inject(FormBuilder);
  private readonly dialogRef      = inject(MatDialogRef<NopayDialog>);
  private readonly masterSvc      = inject(MasterDataService);
  private readonly formulaService = inject(FormulaDefinitionService);

  readonly form = this.fb.group({
    id:          [{ value: this.item?.id ?? null, disabled: true }],
    code:        [{ value: this.item?.code ?? '', disabled: true }, Validators.required],
    name:        [this.item?.name        ?? '', Validators.required],
    days:        [this.item?.days        ?? 0,  [Validators.required, Validators.min(0)]],
    description: [this.item?.description ?? null as string | null],
    isActive:    [this.item?.isActive    ?? true],
  });

  // ── Formula state ─────────────────────────────────────────────────────────
  readonly formulaId         = signal<number | null>(null);
  readonly formulaExpression = signal('');
  readonly formulaIsActive   = signal(true);
  readonly formulaSaving     = signal(false);
  readonly formulaSaveError  = signal<string | null>(null);

  constructor() {
    this.formulaService.getByType('NO_PAY').subscribe(f => {
      if (f) {
        this.formulaId.set(f.id);
        this.formulaExpression.set(f.expression);
        this.formulaIsActive.set(f.isActive);
      }
    });
  }

  onFormulaSaveRequested(value: FormulaDefinitionFormValue): void {
    const id = this.formulaId();
    const payload: FormulaDefinitionRequestDTO = {
      formulaType: 'NO_PAY',
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
          this.formulaService.getByType('NO_PAY').subscribe(f => {
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

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v   = this.form.getRawValue();
    const dto = {
      code:        v.code!,
      name:        v.name!,
      days:        v.days!,
      description: v.description ?? undefined,
      isActive:    v.isActive!,
    };
    if (this.isEdit) {
      this.masterSvc.updateMaster('nopay-days', v.id!, dto).subscribe({
        next: () => { this.masterSvc.reload('nopay-days'); this.dialogRef.close(true); },
        error: () => this.dialogRef.close(false),
      });
    } else {
      this.masterSvc.createMaster('nopay-days', dto).subscribe({
        next: () => { this.masterSvc.reload('nopay-days'); this.dialogRef.close(true); },
        error: () => this.dialogRef.close(false),
      });
    }
  }

  delete(): void {
    const id = this.item?.id;
    if (id == null) return;
    this.masterSvc.deleteMaster('nopay-days', id).subscribe({
      next: () => { this.masterSvc.reload('nopay-days'); this.dialogRef.close(true); },
      error: () => this.dialogRef.close(false),
    });
  }
}
