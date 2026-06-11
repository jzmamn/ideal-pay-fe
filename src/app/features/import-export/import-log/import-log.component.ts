import {
  ChangeDetectionStrategy, Component,
  inject, signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ImportLogEntry, ImportService } from '../import.service';

/** Past imports with status badge and per-import rollback. */
@Component({
  selector: 'app-import-log',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, RouterLink,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule,
  ],
  templateUrl: './import-log.component.html',
  styleUrl: './import-log.component.scss',
})
export class ImportLogComponent {
  private readonly importSvc = inject(ImportService);
  private readonly snackBar = inject(MatSnackBar);

  readonly logs = signal<ImportLogEntry[]>([]);
  readonly loading = signal(true);
  readonly rollingBackId = signal<number | null>(null);

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.importSvc.getLogs().subscribe({
      next: logs => {
        this.logs.set(logs);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Could not load import history', 'Dismiss', { duration: 4000 });
      },
    });
  }

  canRollback(entry: ImportLogEntry): boolean {
    return entry.status === 'COMMITTED' && this.rollingBackId() === null;
  }

  rollback(entry: ImportLogEntry): void {
    if (!this.canRollback(entry)) { return; }

    this.rollingBackId.set(entry.id);
    this.importSvc.rollback(entry.id).subscribe({
      next: () => {
        this.rollingBackId.set(null);
        this.snackBar.open(`Import #${entry.id} rolled back`, 'OK', { duration: 4000 });
        this.reload();
      },
      error: (err: unknown) => {
        this.rollingBackId.set(null);
        const conflict = err instanceof HttpErrorResponse && err.status === 409;
        this.snackBar.open(
          conflict
            ? 'Rollback blocked — rows already processed by a payroll run'
            : 'Rollback failed — please try again',
          'Dismiss', { duration: 5000 });
        this.reload(); // a 409 flips the status to LOCKED
      },
    });
  }

  badgeClass(status: ImportLogEntry['status']): string {
    return `status-badge status-badge--${status.toLowerCase()}`;
  }
}
