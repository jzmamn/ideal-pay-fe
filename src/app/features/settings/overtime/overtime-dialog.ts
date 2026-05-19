import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { OvertimeModel } from './overtime.model';

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
    MatCheckboxModule,
  ],
  host: { class: 'mat-dialog-host' },
  templateUrl: './overtime-dialog.html',
  styleUrl: './overtime.scss',
})
export class OvertimeDialog {
  readonly row = inject<OvertimeModel | null>(MAT_DIALOG_DATA);
  readonly isEdit = this.row != null;

  private readonly fb = inject(FormBuilder);

  readonly overtimeForm = this.fb.group({
    id:             [{ value: this.row?.id ?? null, disabled: true }],
    code:           [this.row?.code           ?? '', Validators.required],
    name:           [this.row?.name           ?? '', Validators.required],
    isActive:       [this.row?.isActive       ?? true],
    liableForEPF:   [this.row?.liableForEPF   ?? false],
    liableForETF:   [this.row?.liableForETF   ?? false],
    liableForNopay: [this.row?.liableForNopay ?? false],
  });
}
