import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { BackupFile, BackupJobStatus, BackupRestoreService } from './backup-restore.service';

const POLL_INTERVAL_MS = 1000;

@Component({
  selector: 'app-backup-restore',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatTableModule,
  ],
  templateUrl: './backup-restore.html',
  styleUrl: './backup-restore.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackupRestore {
  private readonly service = inject(BackupRestoreService);
  private readonly snack = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly pathControl = new FormControl('', { nonNullable: true });

  readonly files = signal<BackupFile[]>([]);
  readonly loadingFiles = signal(false);
  readonly job = signal<BackupJobStatus | null>(null);
  readonly pendingRestore = signal<BackupFile | null>(null);

  readonly jobRunning = computed(() => this.job()?.state === 'RUNNING');
  readonly jobLabel = computed(() => {
    const j = this.job();
    if (!j) return '';
    return j.type === 'BACKUP' ? 'Backing up database' : 'Restoring database';
  });

  readonly displayedColumns = ['fileName', 'sizeBytes', 'createdAt', 'actions'];

  private pollSub: Subscription | null = null;

  constructor() {
    this.service.getConfig()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r => {
          if (!this.pathControl.value) this.pathControl.setValue(r.data.defaultDirectory);
          this.loadFiles();
        },
        error: () => this.loadFiles(),
      });
  }

  loadFiles(): void {
    this.loadingFiles.set(true);
    this.service.listFiles(this.pathControl.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r => { this.files.set(r.data); this.loadingFiles.set(false); },
        error: e => {
          this.loadingFiles.set(false);
          this.snack.open(e.error?.message ?? 'Failed to list backup files', 'Close', { duration: 5000 });
        },
      });
  }

  startBackup(): void {
    if (this.jobRunning()) return;
    this.pendingRestore.set(null);
    this.service.startBackup(this.pathControl.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r => this.trackJob(r.data),
        error: e => this.snack.open(e.error?.message ?? 'Failed to start backup', 'Close', { duration: 5000 }),
      });
  }

  askRestore(file: BackupFile): void {
    if (this.jobRunning()) return;
    this.pendingRestore.set(file);
  }

  cancelRestore(): void {
    this.pendingRestore.set(null);
  }

  confirmRestore(): void {
    const file = this.pendingRestore();
    if (!file || this.jobRunning()) return;
    this.pendingRestore.set(null);
    this.service.startRestore(file.fileName, this.pathControl.value)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r => this.trackJob(r.data),
        error: e => this.snack.open(e.error?.message ?? 'Failed to start restore', 'Close', { duration: 5000 }),
      });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  private trackJob(initial: BackupJobStatus): void {
    this.job.set(initial);
    this.pollSub?.unsubscribe();
    this.pollSub = timer(POLL_INTERVAL_MS, POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => this.service.getJob(initial.jobId)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: r => {
          this.job.set(r.data);
          if (r.data.state !== 'RUNNING') {
            this.pollSub?.unsubscribe();
            this.pollSub = null;
            this.onJobFinished(r.data);
          }
        },
        error: () => {
          this.pollSub?.unsubscribe();
          this.pollSub = null;
          this.snack.open('Lost connection while tracking job progress', 'Close', { duration: 5000 });
        },
      });
  }

  private onJobFinished(job: BackupJobStatus): void {
    if (job.state === 'COMPLETED') {
      const msg = job.type === 'BACKUP'
        ? 'Backup completed successfully'
        : 'Database restored successfully';
      this.snack.open(msg, 'Close', { duration: 4000 });
      this.loadFiles();
    } else {
      this.snack.open(job.error ?? `${job.type === 'BACKUP' ? 'Backup' : 'Restore'} failed`, 'Close', {
        duration: 8000,
      });
    }
  }
}
