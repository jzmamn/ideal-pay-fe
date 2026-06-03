import {
  ChangeDetectionStrategy, Component, computed,
  inject, input, output, signal,
} from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PayrollRunResponse, PayrollRunSummary } from '../payroll-run.model';
import { PayrollRunService } from '../payroll-run.service';
import { lastValueFrom } from 'rxjs';

/** Emitted when the user re-processes from the draft view. */
export interface ReprocessEvent { type: 'individual' | 'batch'; }

@Component({
  selector: 'app-payroll-draft-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, DatePipe,
    MatButtonModule, MatIconModule, MatDividerModule,
    MatProgressSpinnerModule, MatTooltipModule,
  ],
  templateUrl: './payroll-draft-view.html',
  styleUrl:    './payroll-draft-view.scss',
})
export class PayrollDraftViewComponent {
  private readonly runSvc = inject(PayrollRunService);

  // ── Inputs ─────────────────────────────────────────────────────────────

  /** Explicitly set to 'batch' when used from batch payroll. */
  readonly mode        = input<'individual' | 'batch'>('individual');

  /** Single run — set for individual mode. */
  readonly run         = input<PayrollRunResponse | null>(null);

  /** Multiple runs — set for batch mode. */
  readonly batchRuns   = input<PayrollRunSummary[]>([]);

  /** Payroll month string e.g. "2026-06" — used for re-process label. */
  readonly periodLabel = input<string>('');

  /** When true, hides all lock buttons and the status/reprocess bar (read-only view). */
  readonly viewOnly    = input<boolean>(false);

  readonly lockedBy    = input<number>(1); // TODO: replace with auth user id

  // ── Outputs ─────────────────────────────────────────────────────────────

  /** Emitted when user clicks Re-process — parent should call process API again. */
  readonly reprocess = output<ReprocessEvent>();

  /** Emitted when a run is successfully locked. */
  readonly locked    = output<PayrollRunResponse>();

  /** Emitted when all batch runs are locked. */
  readonly batchLocked = output<void>();

  // ── State ───────────────────────────────────────────────────────────────

  readonly locking        = signal(false);
  readonly lockingRunId   = signal<number | null>(null);   // for per-row batch locking
  readonly lockError      = signal<string | null>(null);

  // Drill-down state — batch row → full detail view
  readonly detailRun      = signal<PayrollRunResponse | null>(null);
  readonly detailLoading  = signal(false);

  readonly showDetail     = computed(() => this.isBatchMode() && this.detailRun() !== null);

  // ── Computed ────────────────────────────────────────────────────────────

  readonly isBatchMode = computed(() => this.mode() === 'batch');

  readonly allLocked = computed(() => {
    if (this.isBatchMode()) {
      const runs = this.batchRuns();
      return runs.length > 0 && runs.every(r => r.status === 'LOCKED');
    }
    return this.run()?.status === 'LOCKED';
  });

  readonly batchTotals = computed(() => {
    const runs = this.batchRuns();
    return {
      count:      runs.length,
      grossTotal: runs.reduce((s, r) => s + r.grossPay, 0),
      dedTotal:   runs.reduce((s, r) => s + r.totalDeductions, 0),
      netTotal:   runs.reduce((s, r) => s + r.netPay, 0),
      locked:     runs.filter(r => r.status === 'LOCKED').length,
      draft:      runs.filter(r => r.status === 'DRAFT').length,
    };
  });

  /** Component detail lines — filtered by type and non-zero amount. */
  readonly earnings = computed(() =>
    (this.run()?.details ?? []).filter(d => ['FA','VA','OT'].includes(d.componentType) && d.amount !== 0));

  readonly deductions = computed(() =>
    (this.run()?.details ?? []).filter(d => ['FD','VD','NOPAY','EPF_EE','PAYE'].includes(d.componentType) && d.amount !== 0));

  readonly statutory = computed(() =>
    (this.run()?.details ?? []).filter(d => ['EPF_ER','ETF'].includes(d.componentType) && d.amount !== 0));

  /** Same filters for the drill-down detail run (batch → individual). */
  readonly detailEarnings = computed(() =>
    (this.detailRun()?.details ?? []).filter(d => ['FA','VA','OT'].includes(d.componentType) && d.amount !== 0));

  readonly detailDeductions = computed(() =>
    (this.detailRun()?.details ?? []).filter(d => ['FD','VD','NOPAY','EPF_EE','PAYE'].includes(d.componentType) && d.amount !== 0));

  readonly detailStatutory = computed(() =>
    (this.detailRun()?.details ?? []).filter(d => ['EPF_ER','ETF'].includes(d.componentType) && d.amount !== 0));

  // ── Actions ─────────────────────────────────────────────────────────────

  onReprocess(): void {
    this.reprocess.emit({ type: this.isBatchMode() ? 'batch' : 'individual' });
  }

  async lockRun(): Promise<void> {
    const run = this.run();
    if (!run || run.status === 'LOCKED') return;
    this.locking.set(true);
    this.lockError.set(null);
    try {
      const locked = await lastValueFrom(this.runSvc.lock(run.id, this.lockedBy()));
      this.locked.emit(locked);
    } catch {
      this.lockError.set('Lock failed. Please try again.');
    } finally {
      this.locking.set(false);
    }
  }

  async openDetail(runId: number): Promise<void> {
    this.detailLoading.set(true);
    this.lockError.set(null);
    try {
      const run = await lastValueFrom(this.runSvc.getById(runId));
      this.detailRun.set(run);
    } catch {
      this.lockError.set('Failed to load run details.');
    } finally {
      this.detailLoading.set(false);
    }
  }

  backToSummary(): void {
    this.detailRun.set(null);
  }

  async lockBatchRun(runId: number): Promise<void> {
    this.lockingRunId.set(runId);
    this.lockError.set(null);
    try {
      const locked = await lastValueFrom(this.runSvc.lock(runId, this.lockedBy()));
      // If we're viewing this run's detail, refresh it
      if (this.detailRun()?.id === runId) {
        this.detailRun.set(locked);
      }
      this.batchLocked.emit();
    } catch {
      this.lockError.set(`Lock failed for run ${runId}.`);
    } finally {
      this.lockingRunId.set(null);
    }
  }

  async lockAll(): Promise<void> {
    const drafts = this.batchRuns().filter(r => r.status === 'DRAFT');
    if (!drafts.length) return;
    this.locking.set(true);
    this.lockError.set(null);
    try {
      for (const run of drafts) {
        await lastValueFrom(this.runSvc.lock(run.id, this.lockedBy()));
      }
      this.batchLocked.emit();
    } catch {
      this.lockError.set('One or more locks failed. Please check and retry.');
    } finally {
      this.locking.set(false);
    }
  }
}
