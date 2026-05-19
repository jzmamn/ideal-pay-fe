import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard-placeholder',
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div class="welcome-page">
      <mat-icon class="welcome-icon" aria-hidden="true">verified_user</mat-icon>
      <h1>Welcome, admin!</h1>
      <p>You are successfully authenticated.</p>
      <button mat-raised-button color="warn" (click)="logout()" aria-label="Logout">
        <mat-icon>logout</mat-icon>
        Logout
      </button>
    </div>
  `,
  styles: [
    `
      .welcome-page {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        gap: 1rem;
        background: #f5f7fa;
        text-align: center;
      }
      .welcome-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #185fa5;
      }
      h1 {
        margin: 0;
        color: #0c2340;
        font-size: 2rem;
      }
      p {
        color: #555;
        margin: 0 0 0.5rem;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPlaceholderComponent {
  private readonly auth = inject(AuthService);

  logout(): void {
    this.auth.logout();
  }
}
