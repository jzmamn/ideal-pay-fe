import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LicenseService, LicenseStatus } from './license.service';

@Component({
  selector: 'app-license',
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './license.html',
  styleUrl: './license.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LicenseComponent {
  private readonly service    = inject(LicenseService);
  private readonly snack      = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly license = signal<LicenseStatus | null>(null);
  readonly loading = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.current()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  r => { this.license.set(r.data); this.loading.set(false); },
        error: () => this.loading.set(false),
      });
  }

  validate(): void {
    this.loading.set(true);
    this.service.validate()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r => {
          this.license.set(r.data);
          this.loading.set(false);
          this.snack.open(r.data.message, 'Close', { duration: 3500 });
        },
        error: e => {
          this.loading.set(false);
          this.snack.open(e.error?.message ?? 'Validation failed', 'Close', { duration: 5000 });
        },
      });
  }

  importFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.loading.set(true);
      this.service.importLicense(String(reader.result)) // TODO: replace installedBy with AuthService user id
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: r => {
            this.license.set(r.data);
            this.loading.set(false);
            this.snack.open('License imported.', 'Close', { duration: 3500 });
          },
          error: e => {
            this.loading.set(false);
            this.snack.open(e.error?.message ?? 'Import failed', 'Close', { duration: 5000 });
          },
        });
    };
    reader.readAsText(file);
  }
}
