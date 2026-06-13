import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { SystemSetup } from './system-setup.model';
import { SystemSetupService } from './system-setup.service';

@Component({
  selector: 'app-system-setup',
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './system-setup.html',
  styleUrl: './system-setup.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemSetupComponent {
  private readonly service = inject(SystemSetupService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly displayedColumns = ['code', 'name', 'value', 'isActive', 'effective', 'actions'];
  readonly setups = signal<SystemSetup[]>([]);
  readonly loading = signal(false);
  readonly savingId = signal<number | null>(null);
  readonly editingId = signal<number | null>(null);
  readonly draftValue = signal('');
  readonly draftIsActive = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.setups.set(response.data);
          this.loading.set(false);
        },
        error: error => {
          this.loading.set(false);
          this.showError(error, 'Unable to load system setup values.');
        },
      });
  }

  edit(setup: SystemSetup): void {
    this.editingId.set(setup.id);
    this.draftValue.set(setup.value);
    this.draftIsActive.set(setup.isActive);
  }

  cancel(): void {
    this.editingId.set(null);
  }

  save(setup: SystemSetup): void {
    const value = this.draftValue().trim();
    if (!value) {
      this.snackBar.open('Value is required.', 'Close', { duration: 3500 });
      return;
    }

    this.savingId.set(setup.id);
    this.service.update(setup.id, {
      value,
      isActive: this.draftIsActive(),
      modifiedBy: 1, // Temporary until authentication exposes the current user ID.
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => {
          this.setups.update(items =>
            items.map(item => item.id === response.data.id ? response.data : item),
          );
          this.savingId.set(null);
          this.editingId.set(null);
          this.snackBar.open(response.message, 'Close', { duration: 3000 });
        },
        error: error => {
          this.savingId.set(null);
          this.showError(error, 'Unable to update system setup value.');
        },
      });
  }

  private showError(error: { error?: { message?: string } }, fallback: string): void {
    this.snackBar.open(error.error?.message ?? fallback, 'Close', { duration: 5000 });
  }
}
