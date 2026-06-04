import {
  ChangeDetectionStrategy, Component, DestroyRef,
  inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmailSettingsService } from './email-settings.service';

@Component({
  selector: 'app-email-settings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  templateUrl: './email-settings.html',
  styleUrl: './email-settings.scss',
})
export class EmailSettings {
  private readonly fb         = inject(FormBuilder);
  private readonly svc        = inject(EmailSettingsService);
  private readonly snackBar   = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly loading  = signal(false);
  readonly saving   = signal(false);
  readonly testing  = signal(false);
  readonly showPass = signal(false);

  readonly form = this.fb.group({
    host       : this.fb.nonNullable.control('', Validators.required),
    port       : this.fb.nonNullable.control(587, [Validators.required, Validators.min(1), Validators.max(65535)]),
    username   : this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    password   : this.fb.nonNullable.control('', Validators.required),
    fromName   : this.fb.nonNullable.control('', Validators.required),
    fromAddress: this.fb.nonNullable.control('', [Validators.required, Validators.email]),
    useTls     : this.fb.nonNullable.control(true),
  });

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.svc.get()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: cfg => {
          this.form.patchValue({ ...cfg, password: '' });
          this.loading.set(false);
        },
        error: () => {
          // No config yet — form starts empty
          this.loading.set(false);
        },
      });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.svc.save(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Email settings saved.', 'Close', { duration: 3000 });
          this.form.patchValue({ password: '' });
          this.form.markAsPristine();
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Failed to save settings.', 'Close', { duration: 4000 });
        },
      });
  }

  testConnection(): void {
    this.testing.set(true);
    this.svc.testConnection()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.testing.set(false);
          this.snackBar.open(res.message, 'Close', { duration: 5000 });
        },
        error: () => {
          this.testing.set(false);
          this.snackBar.open('Connection test failed.', 'Close', { duration: 4000 });
        },
      });
  }
}
