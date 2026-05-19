import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../services/auth.service';


@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly showPassword = signal(false);
  protected readonly loginError = signal(false);
  protected readonly isShaking = signal(false);
  protected readonly isLoading = signal(false);

  protected readonly form = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.loginError.set(false);

    const { username, password } = this.form.value;
    this.auth.login(username!, password!).subscribe(success => {
      this.isLoading.set(false);
      if (success) {
        this.router.navigate(['/dashboard']);
      } else {
        this.loginError.set(true);
        this.triggerShake();
      }
    });
  }

  private triggerShake(): void {
    this.isShaking.set(true);
    setTimeout(() => this.isShaking.set(false), 600);
  }
}
