import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { PermissionModel } from './permission.model';

@Component({
  selector: 'app-permission-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
  ],
  host: { class: 'mat-dialog-host' },
  templateUrl: './permission-dialog.html',
  styleUrl: './permissions.scss',
})
export class PermissionDialog {
  readonly row = inject<PermissionModel | null>(MAT_DIALOG_DATA);
  readonly isEdit = this.row != null;

  private readonly fb = inject(FormBuilder);

  readonly permissionForm = this.fb.group({
    id:       [{ value: this.row?.id ?? null, disabled: true }],
    code:     [this.row?.code     ?? '', Validators.required],
    name:     [this.row?.name     ?? '', Validators.required],
    module:   [this.row?.module   ?? '', Validators.required],
    isActive: [this.row?.isActive ?? true],
  });
}
