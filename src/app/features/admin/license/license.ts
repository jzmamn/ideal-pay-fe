import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
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
  private readonly service = inject(LicenseService);
  private readonly snack = inject(MatSnackBar);
  readonly license = signal<LicenseStatus | null>(null);
  readonly loading = signal(false);
  constructor() { this.load(); }
  load() {
    this.loading.set(true);
    this.service.current().subscribe({ next: r => { this.license.set(r.data); this.loading.set(false); }, error: () => this.loading.set(false) });
  }
  validate() {
    this.loading.set(true);
    this.service.validate().subscribe({ next: r => { this.license.set(r.data); this.loading.set(false); this.snack.open(r.data.message, 'Close', { duration: 3500 }); }, error: e => { this.loading.set(false); this.snack.open(e.error?.message ?? 'Validation failed', 'Close'); } });
  }
  importFile(event: Event) {
    const input = event.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      this.loading.set(true);
      this.service.importLicense(String(reader.result)).subscribe({ next: r => { this.license.set(r.data); this.loading.set(false); this.snack.open('License imported.', 'Close', { duration: 3500 }); }, error: e => { this.loading.set(false); this.snack.open(e.error?.message ?? 'Import failed', 'Close'); } });
    };
    reader.readAsText(file);
  }
}
