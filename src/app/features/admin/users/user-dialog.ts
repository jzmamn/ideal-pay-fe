import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UserModel } from './user.model';

function passwordsMatchValidator(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const pw  = group.get('password')?.value;
    const cpw = group.get('confirmPassword')?.value;
    if (!pw && !cpw) return null;
    return pw === cpw ? null : { passwordsMismatch: true };
  };
}

export const AVAILABLE_ROLES = [
  'Administrator',
  'Manager',
  'Accountant',
  'HR Officer',
  'Payroll Clerk',
  'Viewer',
];

@Component({
  selector: 'app-user-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
  ],
  host: { class: 'mat-dialog-host' },
  templateUrl: './user-dialog.html',
  styleUrl: './users.scss',
})
export class UserDialog {
  readonly row = inject<UserModel | null>(MAT_DIALOG_DATA);
  readonly roles = AVAILABLE_ROLES;
  readonly isEdit = this.row != null;

  showPassword = false;
  showConfirmPassword = false;

  private readonly fb = inject(FormBuilder);

  readonly userForm = this.fb.group(
    {
      id:              [{ value: this.row?.id ?? null, disabled: true }],
      code:            [{ value: this.row?.code ?? null, disabled: true }],
      username:        [this.row?.username ?? '', Validators.required],
      fullName:        [this.row?.fullName ?? '', Validators.required],
      email:           [this.row?.email    ?? '', [Validators.required, Validators.email]],
      role:            [this.row?.role     ?? '', Validators.required],
      isActive:        [this.row?.isActive ?? true],
      password:        ['', this.isEdit ? [] : [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', this.isEdit ? [] : [Validators.required]],
    },
    { validators: passwordsMatchValidator() },
  );
}
