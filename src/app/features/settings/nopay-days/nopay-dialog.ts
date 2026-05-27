import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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
  ],
  host: { class: 'mat-dialog-host' },
  templateUrl: './nopay-dialog.html',
  styleUrl: './nopay-dialog.scss',
})
export class NopayDialog {
  readonly item = inject<NoPayDays | null>(MAT_DIALOG_DATA);
  readonly isEdit = this.item != null;

  private readonly fb        = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<NopayDialog>);
  private readonly masterSvc = inject(MasterDataService);

  readonly form = this.fb.group({
    id:          [{ value: this.item?.id ?? null, disabled: true }],
    code:        [{ value: this.item?.code ?? '', disabled: true }, Validators.required],
    name:        [this.item?.name        ?? '', Validators.required],
    description: [this.item?.description ?? null as string | null],
    isActive:    [this.item?.isActive    ?? true],
  });

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v   = this.form.getRawValue();
    const dto = {
      code:        v.code!,
      name:        v.name!,
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
