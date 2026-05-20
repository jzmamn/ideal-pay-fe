import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { UserModel } from './user.model';
import { UserService } from './user.service';

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
  readonly row    = inject<UserModel | null>(MAT_DIALOG_DATA);
  readonly roles  = AVAILABLE_ROLES;
  readonly isEdit = this.row != null;

  showPassword        = false;
  showConfirmPassword = false;

  private readonly fb        = inject(FormBuilder);
  private readonly userSvc   = inject(UserService);
  private readonly dialogRef = inject(MatDialogRef<UserDialog>);

  readonly userForm = this.fb.group(
    {
      id:              [{ value: this.row?.id ?? null, disabled: true }],
      code:            [{ value: this.row?.code ?? '', disabled: this.isEdit }, Validators.required],
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

  save(): void {
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    const v = this.userForm.getRawValue();

    const handlers = {
      next: () => this.dialogRef.close(true),
      error: () => this.dialogRef.close(false),
    };

    if (this.isEdit) {
      this.userSvc.update(this.row!.id, {
        code:     v.code!,
        username: v.username!,
        fullName: v.fullName!,
        email:    v.email!,
        role:     v.role!,
        isActive: v.isActive!,
        ...(v.password ? { password: v.password } : {}),
      }).subscribe(handlers);
    } else {
      this.userSvc.create({
        code:     v.code!,
        username: v.username!,
        fullName: v.fullName!,
        email:    v.email!,
        role:     v.role!,
        isActive: v.isActive!,
        password: v.password!,
      }).subscribe(handlers);
    }
  }

  delete(): void {
    if (this.row?.id == null) return;
    this.userSvc.delete(this.row.id).subscribe({
      next: () => this.dialogRef.close(true),
      error: () => this.dialogRef.close(false),
    });
  }
}
