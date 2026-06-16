import {
  ChangeDetectionStrategy, Component, DestroyRef,
  OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { BonusService } from '../../settings/bonus/bonus.service';
import { BonusModel } from '../../settings/bonus/bonus.model';
import { BonusProcessingService } from './bonus-processing.service';
import { MasterDataService } from '../../../shared/services/master-data.service';
import {
  BonusApprovalReport,
  BonusEntryRow,
  BonusProcessingBatch,
  BonusSummaryReport,
  BonusDepartmentReport,
} from './bonus-processing.model';

type Step = 'setup' | 'review' | 'approved' | 'processed';

@Component({
  selector: 'app-bonus-management',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule, MatCardModule, MatChipsModule,
    MatDividerModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatProgressSpinnerModule,
    MatSelectModule, MatSnackBarModule, MatStepperModule,
    MatTableModule, MatTooltipModule, MatTabsModule,
  ],
  templateUrl: './bonus-management.html',
  styleUrl: './bonus-management.scss',
})
export class BonusManagement implements OnInit {
  private readonly fb          = inject(FormBuilder);
  private readonly bonusSvc    = inject(BonusService);
  private readonly procSvc     = inject(BonusProcessingService);
  private readonly snackBar    = inject(MatSnackBar);
  private readonly destroyRef  = inject(DestroyRef);
  readonly masterSvc           = inject(MasterDataService);

  // ── Lookup data ────────────────────────────────────────────────────────────
  readonly bonusTypes   = signal<BonusModel[]>([]);

  readonly months = [
    { value:  1, label: 'January'   }, { value:  2, label: 'February'  },
    { value:  3, label: 'March'     }, { value:  4, label: 'April'     },
    { value:  5, label: 'May'       }, { value:  6, label: 'June'      },
    { value:  7, label: 'July'      }, { value:  8, label: 'August'    },
    { value:  9, label: 'September' }, { value: 10, label: 'October'   },
    { value: 11, label: 'November'  }, { value: 12, label: 'December'  },
  ];

  private readonly _today = new Date();
  readonly years = [
    this._today.getFullYear() - 1,
    this._today.getFullYear(),
    this._today.getFullYear() + 1,
  ];

  // ── Step 1: Setup form ─────────────────────────────────────────────────────
  readonly setupForm = this.fb.group({
    bonusId:    this.fb.nonNullable.control<number | null>(null, Validators.required),
    month:      this.fb.nonNullable.control(this._today.getMonth() + 1, [Validators.required, Validators.min(1)]),
    year:       this.fb.nonNullable.control(this._today.getFullYear(), Validators.required),
    notes:      this.fb.control<string | null>(null),

    // Employee filter
    selectionMode: this.fb.nonNullable.control<'all' | 'filter'>('all'),
    departmentId:  this.fb.control<number | null>(null),
    branchId:      this.fb.control<number | null>(null),
    designationId: this.fb.control<number | null>(null),
    gradeId:       this.fb.control<number | null>(null),
    employeeTypeId:this.fb.control<number | null>(null),

    // Formula context extras
    grossSalary:            this.fb.control<number | null>(null),
    attendancePercentage:   this.fb.control<number | null>(null),
    performanceRating:      this.fb.control<number | null>(null),
    workedDays:             this.fb.control<number | null>(null),
    salesAchievement:       this.fb.control<number | null>(null),
    productivityPercentage: this.fb.control<number | null>(null),
  });

  readonly selectedBonus = computed(() => {
    const id = this.setupForm.getRawValue().bonusId;
    return this.bonusTypes().find(b => b.id === id) ?? null;
  });

  readonly isFormulaBonus = computed(() => !!this.selectedBonus()?.formula);

  // ── Processing state ───────────────────────────────────────────────────────
  readonly step         = signal<Step>('setup');
  readonly loading      = signal(false);
  readonly actionBusy   = signal(false);
  readonly error        = signal<string | null>(null);

  readonly batch        = signal<BonusProcessingBatch | null>(null);
  readonly entries      = signal<BonusEntryRow[]>([]);

  readonly totalEffective = computed(() =>
    this.entries().reduce((s, e) => s + e.effectiveAmount, 0)
  );

  // ── Existing batches list ──────────────────────────────────────────────────
  readonly existingBatches = signal<BonusProcessingBatch[]>([]);
  readonly batchesLoading  = signal(false);
  readonly selectedBatchId = signal<number | null>(null);

  // ── Reports ────────────────────────────────────────────────────────────────
  readonly reportMonth        = signal('');
  readonly summaryReport      = signal<BonusSummaryReport[]>([]);
  readonly employeeReport     = signal<BonusEntryRow[]>([]);
  readonly departmentReport   = signal<BonusDepartmentReport[]>([]);
  readonly approvalReport     = signal<BonusApprovalReport[]>([]);
  readonly reportsLoading     = signal(false);

  // ── Table column definitions ───────────────────────────────────────────────
  readonly reviewColumns     = ['empCode', 'empName', 'department', 'designation', 'branch',
                                'formula', 'calculated', 'adjusted', 'effective', 'note', 'actions'];
  readonly paymentColumns    = ['empCode', 'empName', 'effective', 'status'];
  readonly summaryColumns    = ['bonusName', 'payrollMonth', 'status', 'employees', 'total'];
  readonly empReportColumns  = ['empCode', 'empName', 'department', 'effective', 'status'];
  readonly deptReportColumns = ['dept', 'bonus', 'month', 'count', 'total'];
  readonly approvalColumns   = ['batchId', 'bonusName', 'payrollMonth', 'status', 'employees', 'total', 'approvedBy', 'approvedDate'];

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.masterSvc.loadAll();
    this._loadBonusTypes();
    this._loadExistingBatches();
  }

  // ── Setup → Calculate ──────────────────────────────────────────────────────
  calculate(): void {
    if (this.setupForm.invalid || this.loading()) return;
    this.error.set(null);
    this.loading.set(true);

    const raw = this.setupForm.getRawValue();
    const payrollMonth = `${raw.year}-${String(raw.month).padStart(2, '0')}`;

    const formulaContext: Record<string, unknown> = {};
    if (raw.grossSalary            != null) formulaContext['grossSalary']            = raw.grossSalary;
    if (raw.attendancePercentage   != null) formulaContext['attendancePercentage']   = raw.attendancePercentage;
    if (raw.performanceRating      != null) formulaContext['performanceRating']      = raw.performanceRating;
    if (raw.workedDays             != null) formulaContext['workedDays']             = raw.workedDays;
    if (raw.salesAchievement       != null) formulaContext['salesAchievement']       = raw.salesAchievement;
    if (raw.productivityPercentage != null) formulaContext['productivityPercentage'] = raw.productivityPercentage;

    this.procSvc.calculate({
      bonusId:      raw.bonusId!,
      payrollMonth,
      departmentId: raw.selectionMode === 'filter' ? raw.departmentId : null,
      branchId:     raw.selectionMode === 'filter' ? raw.branchId      : null,
      designationId:raw.selectionMode === 'filter' ? raw.designationId : null,
      gradeId:      raw.selectionMode === 'filter' ? raw.gradeId       : null,
      employeeTypeId: raw.selectionMode === 'filter' ? raw.employeeTypeId : null,
      formulaContext: Object.keys(formulaContext).length ? formulaContext : undefined,
      notes: raw.notes,
      createdBy:  1, // TODO: replace with AuthService user id
      modifiedBy: 1,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        this.loading.set(false);
        this.batch.set(result);
        this.entries.set((result.entries ?? []).map(e => ({ ...e, _editAmount: null, _editNote: '', _dirty: false })));
        this.step.set('review');
        this._loadExistingBatches();
      },
      error: (err: unknown) => {
        this.loading.set(false);
        this.error.set(this._extractError(err, 'Calculation failed. Please try again.'));
      },
    });
  }

  // ── Load existing batch ────────────────────────────────────────────────────
  loadBatch(batchId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedBatchId.set(batchId);
    this.procSvc.getBatchById(batchId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: b => {
          this.loading.set(false);
          this.batch.set(b);
          this.entries.set((b.entries ?? []).map(e => ({ ...e, _editAmount: null, _editNote: '', _dirty: false })));
          this.step.set(this._stepFromStatus(b.status));
        },
        error: (err: unknown) => {
          this.loading.set(false);
          this.error.set(this._extractError(err, 'Failed to load batch.'));
        },
      });
  }

  // ── Adjust entry ───────────────────────────────────────────────────────────
  startEdit(entry: BonusEntryRow): void {
    this.entries.update(rows =>
      rows.map(r => r.id === entry.id
        ? { ...r, _editAmount: r.adjustedAmount ?? r.calculatedAmount, _editNote: r.note ?? '' }
        : r
      )
    );
  }

  /** Reads _editAmount / _editNote directly from the row — no template-ref variables needed. */
  saveEdit(entry: BonusEntryRow): void {
    const batchId = this.batch()?.id;
    if (!batchId) return;
    const newAmount = entry._editAmount ?? entry.calculatedAmount;
    const note      = entry._editNote  ?? '';

    this.procSvc.adjustEntry(batchId, entry.id, newAmount, note, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: updated => {
          this.entries.update(rows =>
            rows.map(r => r.id === updated.id
              ? { ...updated, _editAmount: null, _editNote: '', _dirty: false }
              : r
            )
          );
          // Update batch total in header
          this.batch.update(b => b ? { ...b, totalAmount: this.totalEffective() } : b);
        },
        error: (err: unknown) => this._snack(this._extractError(err, 'Adjustment failed'), 'error'),
      });
  }

  cancelEdit(entry: BonusEntryRow): void {
    this.entries.update(rows =>
      rows.map(r => r.id === entry.id ? { ...r, _editAmount: null } : r)
    );
  }

  // ── Approve ────────────────────────────────────────────────────────────────
  approve(): void {
    const batchId = this.batch()?.id;
    if (!batchId || this.actionBusy()) return;
    this.actionBusy.set(true);
    this.error.set(null);

    this.procSvc.approveBatch(batchId, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.actionBusy.set(false);
          this.batch.set(result);
          this.entries.set(result.entries ?? []);
          this.step.set('approved');
          this._snack('Bonus batch approved successfully', 'success');
          this._loadExistingBatches();
        },
        error: (err: unknown) => {
          this.actionBusy.set(false);
          this.error.set(this._extractError(err, 'Approval failed.'));
        },
      });
  }

  // ── Process (pay) ──────────────────────────────────────────────────────────
  process(): void {
    const batchId = this.batch()?.id;
    if (!batchId || this.actionBusy()) return;
    this.actionBusy.set(true);
    this.error.set(null);

    this.procSvc.processBatch(batchId, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.actionBusy.set(false);
          this.batch.set(result);
          this.entries.set(result.entries ?? []);
          this.step.set('processed');
          this._snack('Bonus payments processed successfully', 'success');
          this._loadExistingBatches();
        },
        error: (err: unknown) => {
          this.actionBusy.set(false);
          this.error.set(this._extractError(err, 'Processing failed.'));
        },
      });
  }

  // ── Cancel batch ───────────────────────────────────────────────────────────
  cancelBatch(): void {
    const batchId = this.batch()?.id;
    if (!batchId || this.actionBusy()) return;
    this.actionBusy.set(true);

    this.procSvc.cancelBatch(batchId, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.actionBusy.set(false);
          this.reset();
          this._snack('Batch cancelled', 'warn');
          this._loadExistingBatches();
        },
        error: (err: unknown) => {
          this.actionBusy.set(false);
          this._snack(this._extractError(err, 'Cancel failed'), 'error');
        },
      });
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  reset(): void {
    this.batch.set(null);
    this.entries.set([]);
    this.error.set(null);
    this.step.set('setup');
    this.selectedBatchId.set(null);
  }

  // ── Reports ────────────────────────────────────────────────────────────────
  loadReports(): void {
    this.reportsLoading.set(true);
    const month = this.reportMonth() || undefined;

    this.procSvc.getSummaryReport(month)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: d => this.summaryReport.set(d), error: () => {} });

    this.procSvc.getEmployeeReport(month)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: d => this.employeeReport.set(d), error: () => {} });

    this.procSvc.getDepartmentReport(month)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: d => this.departmentReport.set(d), error: () => {} });

    this.procSvc.getApprovalReport(month)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  d => { this.approvalReport.set(d); this.reportsLoading.set(false); },
        error: () => this.reportsLoading.set(false),
      });
  }

  exportEmployeeReport(): void {
    const rows = this.employeeReport();
    const csv = [
      ['Employee Number', 'Employee Name', 'Department', 'Bonus Amount', 'Payment Status'],
      ...rows.map(row => [
        row.empCode,
        row.empName,
        row.departmentName ?? '',
        row.effectiveAmount,
        row.status,
      ]),
    ].map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');

    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    link.download = `bonus-payment-report-${this.reportMonth() || 'all'}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  printReport(): void {
    window.print();
  }

  // ── Inline edit helpers ────────────────────────────────────────────────────

  /** Called from template (input) events to mutate the row's edit fields in-place. */
  updateRowEditAmount(entry: BonusEntryRow, value: string): void {
    this.entries.update(rows =>
      rows.map(r => r.id === entry.id ? { ...r, _editAmount: +value } : r)
    );
  }

  updateRowEditNote(entry: BonusEntryRow, value: string): void {
    this.entries.update(rows =>
      rows.map(r => r.id === entry.id ? { ...r, _editNote: value } : r)
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  statusColor(status: string): string {
    switch (status) {
      case 'PENDING':   return 'accent';
      case 'APPROVED':  return 'primary';
      case 'PROCESSED': return '';
      case 'CANCELLED': return 'warn';
      default:          return '';
    }
  }

  private _stepFromStatus(status: string): Step {
    switch (status) {
      case 'APPROVED':  return 'approved';
      case 'PROCESSED': return 'processed';
      case 'CANCELLED': return 'setup';
      default:          return 'review';
    }
  }

  private _loadBonusTypes(): void {
    this.bonusSvc.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: d => this.bonusTypes.set(d.filter(b => b.isActive)), error: () => {} });
  }

  private _loadExistingBatches(): void {
    this.batchesLoading.set(true);
    this.procSvc.getBatches()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  d => { this.existingBatches.set(d); this.batchesLoading.set(false); },
        error: () => this.batchesLoading.set(false),
      });
  }

  private _snack(message: string, type: 'success' | 'warn' | 'error'): void {
    this.snackBar.open(message, 'Close', {
      duration:            4000,
      panelClass:          type === 'success' ? 'snack-success' : type === 'warn' ? 'snack-warn' : 'snack-error',
      horizontalPosition:  'end',
      verticalPosition:    'top',
    });
  }

  private _extractError(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      return err.error?.message ?? err.error?.error ?? err.message ?? fallback;
    }
    if (err instanceof Error) return err.message;
    return fallback;
  }
}
