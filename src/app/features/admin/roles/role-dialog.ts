import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RoleModel } from './role.model';

@Component({
  selector: 'app-role-dialog',
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
  templateUrl: './role-dialog.html',
  styleUrl: './roles.scss',
})
export class RoleDialog {
  readonly row = inject<RoleModel | null>(MAT_DIALOG_DATA);
  readonly isEdit = this.row != null;

  private readonly fb = inject(FormBuilder);

  readonly roleForm = this.fb.group({
    id:          [{ value: this.row?.id ?? null, disabled: true }],
    code:        [{ value: this.row?.code ?? '', disabled: this.isEdit }, Validators.required],
    name:        [this.row?.name        ?? '', Validators.required],
    description: [this.row?.description ?? ''],
    isActive:    [this.row?.isActive    ?? true],
  });
}
