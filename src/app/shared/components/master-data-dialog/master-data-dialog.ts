import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MasterEntity } from '../../models/master-data.models';
import { EntitySlug, MasterDataService } from '../../services/master-data.service';

export interface FieldDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'textarea';
  optional?: boolean;
}

export interface MasterDataDialogData {
  entity: EntitySlug;
  title?: string;
  icon?: string;
  item?: MasterEntity;
  extraFields?: FieldDef[];
}

@Component({
  selector: 'app-master-data-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'mat-dialog-host' },
  imports: [
    TitleCasePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatDividerModule,
  ],
  templateUrl: './master-data-dialog.html',
  styleUrl: './master-data-dialog.scss',
})
export class MasterDataDialog {
  readonly data = inject<MasterDataDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<MasterDataDialog>);
  private readonly masterSvc = inject(MasterDataService);
  private readonly fb = inject(FormBuilder);

  readonly isEdit = this.data.item != null;
  readonly form: FormGroup;

  constructor() {
    this.form = this.fb.group({
      id:       [{ value: this.data.item?.id ?? null, disabled: true }],
      code:     [{ value: this.data.item?.code ?? '', disabled: true }, Validators.required],
      name:     [this.data.item?.name     ?? '', Validators.required],
      isActive: [this.data.item?.isActive ?? true],
    });

    (this.data.extraFields ?? []).forEach(f => {
      const existing = this.data.item as Record<string, unknown> | undefined;
      const val = existing?.[f.key] ?? (f.type === 'number' ? 0 : '');
      this.form.addControl(f.key, this.fb.control(val, f.optional ? [] : Validators.required));
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue() as Record<string, unknown>;
    const dto: Partial<MasterEntity> = {
      code:     v['code'] as string,
      name:     v['name'] as string,
      isActive: v['isActive'] as boolean,
    };
    (this.data.extraFields ?? []).forEach(f => { (dto as Record<string, unknown>)[f.key] = v[f.key]; });

    if (this.isEdit) {
      this.masterSvc.updateMaster(this.data.entity, v['id'] as number, dto).subscribe({
        next: () => { this.masterSvc.reload(this.data.entity ); this.dialogRef.close(true); },
        error: () => this.dialogRef.close(false),
      });
    } else {
      this.masterSvc.createMaster(this.data.entity, dto).subscribe({
        next: () => { this.masterSvc.reload(this.data.entity ); this.dialogRef.close(true); },
        error: () => this.dialogRef.close(false),
      });
    }
  }

  delete(): void {
    const id = this.data.item?.id;
    if (id == null) return;
    this.masterSvc.deleteMaster(this.data.entity, id).subscribe({
      next: () => { this.masterSvc.reload(this.data.entity ); this.dialogRef.close(true); },
      error: () => this.dialogRef.close(false),
    });
  }
}
