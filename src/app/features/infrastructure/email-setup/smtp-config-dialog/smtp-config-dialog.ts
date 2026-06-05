import {
  ChangeDetectionStrategy, Component, inject, signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { EmailConfigResponse } from '../../../settings/email-settings/email-settings.service';

export interface SmtpConfigDialogData {
  config?: EmailConfigResponse;
}

@Component({
  selector: 'app-smtp-config-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit() ? 'Edit' : 'New' }} SMTP Configuration</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="smtp-dialog-form" novalidate>

        <!-- Name -->
        <mat-form-field appearance="outline">
          <mat-label>Configuration Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Gmail, SendGrid, Office 365" />
          <mat-icon matPrefix>label</mat-icon>
          @if (form.controls.name.invalid && form.controls.name.touched) {
            <mat-error>Name is required.</mat-error>
          }
        </mat-form-field>

        <!-- Host + Port -->
        <div class="field-row">
          <mat-form-field appearance="outline" class="field-host">
            <mat-label>SMTP Host</mat-label>
            <input matInput formControlName="host" placeholder="smtp.example.com" />
            <mat-icon matPrefix>dns</mat-icon>
            @if (form.controls.host.invalid && form.controls.host.touched) {
              <mat-error>Host is required.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="field-port">
            <mat-label>Port</mat-label>
            <input matInput type="number" formControlName="port" />
            @if (form.controls.port.invalid && form.controls.port.touched) {
              <mat-error>Valid port required (1–65535).</mat-error>
            }
          </mat-form-field>
        </div>

        <!-- TLS -->
        <mat-slide-toggle formControlName="useTls" class="tls-toggle">
          Use TLS / STARTTLS
        </mat-slide-toggle>

        <!-- Username -->
        <mat-form-field appearance="outline">
          <mat-label>Username / Email</mat-label>
          <input matInput formControlName="username" autocomplete="off" />
          <mat-icon matPrefix>person</mat-icon>
          @if (form.controls.username.invalid && form.controls.username.touched) {
            <mat-error>Valid email required.</mat-error>
          }
        </mat-form-field>

        <!-- Password -->
        <mat-form-field appearance="outline">
          <mat-label>{{ isEdit() ? 'Password (leave blank to keep existing)' : 'Password' }}</mat-label>
          <input
            matInput
            [type]="showPass() ? 'text' : 'password'"
            formControlName="password"
            autocomplete="new-password"
          />
          <mat-icon matPrefix>lock</mat-icon>
          <button
            mat-icon-button matSuffix
            type="button"
            (click)="showPass.set(!showPass())"
            [attr.aria-label]="showPass() ? 'Hide password' : 'Show password'"
          >
            <mat-icon>{{ showPass() ? 'visibility_off' : 'visibility' }}</mat-icon>
          </button>
          @if (form.controls.password.invalid && form.controls.password.touched) {
            <mat-error>Password is required.</mat-error>
          }
        </mat-form-field>

        <!-- From Name + From Address -->
        <div class="field-row">
          <mat-form-field appearance="outline">
            <mat-label>From Name</mat-label>
            <input matInput formControlName="fromName" placeholder="Ideal Payroll" />
            <mat-icon matPrefix>badge</mat-icon>
            @if (form.controls.fromName.invalid && form.controls.fromName.touched) {
              <mat-error>From name is required.</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>From Email Address</mat-label>
            <input matInput formControlName="fromAddress" placeholder="payroll@example.com" />
            <mat-icon matPrefix>alternate_email</mat-icon>
            @if (form.controls.fromAddress.invalid && form.controls.fromAddress.touched) {
              <mat-error>Valid email required.</mat-error>
            }
          </mat-form-field>
        </div>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button [disabled]="form.invalid" (click)="submit()">
        <mat-icon>save</mat-icon>
        {{ isEdit() ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .smtp-dialog-form {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 520px;
      padding-top: 4px;
    }
    mat-form-field { width: 100%; }
    .field-row {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 12px;
      align-items: flex-start;
    }
    .field-host { flex: 1; }
    .field-port { width: 110px; }
    .tls-toggle { margin: 4px 0 8px; }
  `],
})
export class SmtpConfigDialog {
  private readonly fb        = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<SmtpConfigDialog>);
  readonly data              = inject<SmtpConfigDialogData>(MAT_DIALOG_DATA);

  readonly isEdit  = signal(!!this.data?.config);
  readonly showPass = signal(false);

  readonly form = this.fb.group({
    name       : this.fb.nonNullable.control(this.data?.config?.name ?? '', Validators.required),
    host       : this.fb.nonNullable.control(this.data?.config?.host ?? '', Validators.required),
    port       : this.fb.nonNullable.control(this.data?.config?.port ?? 587,
                   [Validators.required, Validators.min(1), Validators.max(65535)]),
    useTls     : this.fb.nonNullable.control(this.data?.config?.useTls ?? true),
    username   : this.fb.nonNullable.control(this.data?.config?.username ?? '',
                   [Validators.required, Validators.email]),
    password   : this.fb.nonNullable.control('',
                   this.data?.config ? [] : [Validators.required]),
    fromName   : this.fb.nonNullable.control(this.data?.config?.fromName ?? '', Validators.required),
    fromAddress: this.fb.nonNullable.control(this.data?.config?.fromAddress ?? '',
                   [Validators.required, Validators.email]),
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.getRawValue());
  }
}
