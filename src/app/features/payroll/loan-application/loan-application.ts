import {
  ChangeDetectionStrategy, Component, DestroyRef,
  computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import { type EmployeeResponse } from '../../settings/employee/employee.model';
import { TableAutocomplete, type TableColumn } from '../../../shared/components/table-autocomplete/table-autocomplete';
import {
  LoanApplicationService,
  type LoanApplicationRequest,
  type LoanApplicationResponse,
  type LoanType,
} from './loan-application.service';

// ── Month helpers ─────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function buildMonthOptions(today: Date): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [];
  for (let delta = -11; delta <= 12; delta++) {
    const d = new Date(today.getFullYear(), today.getMonth() + delta, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    opts.push({ value: `${y}-${m}`, label: `${MONTH_NAMES[d.getMonth()]} ${y}` });
  }
  return opts;
}

function formatMonthValue(value: string): string {
  const [y, m] = value.split('-');
  const idx = parseInt(m, 10) - 1;
  return `${MONTH_NAMES[idx] ?? m} ${y}`;
}

// ── Constants ─────────────────────────────────────────────────────────────

const CURRENT_USER_ID = 1; // TODO: replace with AuthService user id

// ── Component ─────────────────────────────────────────────────────────────

@Component({
  selector: 'app-loan-application',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe, DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTooltipModule,
    TableAutocomplete,
  ],
  templateUrl: './loan-application.html',
  styleUrl:    './loan-application.scss',
})
export class LoanApplication {
  private readonly fb         = inject(FormBuilder);
  private readonly svc        = inject(LoanApplicationService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Employee autocomplete ──────────────────────────────────────────────
  readonly employeeCols: TableColumn<EmployeeResponse>[] = [
    { key: 'employeeNo', label: 'Emp #'      },
    { key: 'firstName',  label: 'First Name' },
    { key: 'lastName',   label: 'Last Name'  },
  ];
  readonly empDisplayFn = (e: EmployeeResponse): string =>
    `${e.payrollName} — ${e.employeeNo}`;

  // ── Month options ──────────────────────────────────────────────────────
  private readonly _today = new Date();
  readonly monthOptions   = buildMonthOptions(this._today);

  private get _currentMonth(): string {
    return `${this._today.getFullYear()}-${String(this._today.getMonth() + 1).padStart(2, '0')}`;
  }

  // ── State ──────────────────────────────────────────────────────────────
  readonly loading         = signal(false);
  readonly saving          = signal(false);
  readonly saveError       = signal<string | null>(null);
  readonly deleting        = signal(false);

  readonly loanTypes       = signal<LoanType[]>([]);
  private readonly _loans  = signal<LoanApplicationResponse[]>([]);

  readonly formMode        = signal<'none' | 'create' | 'edit'>('none');
  private readonly _editId = signal<number | null>(null);
  readonly pendingDeleteId = signal<number | null>(null);

  // ── Filters ────────────────────────────────────────────────────────────
  readonly monthFilter    = signal<string | null>(null);
  readonly loanTypeFilter = signal<number | null>(null);
  readonly statusFilter   = signal<'all' | 'pending' | 'processed'>('all');
  readonly searchFilter   = signal('');

  // ── Form ──────────────────────────────────────────────────────────────
  readonly form = this.fb.group({
    employeeId:    this.fb.control<number | null>(null, Validators.required),
    loanId:        this.fb.control<number | null>(null, Validators.required),
    principalAmount: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    installments:  this.fb.control<number | null>(null, [Validators.required, Validators.min(1), Validators.max(360)]),
    payrollMonth:  this.fb.nonNullable.control('', Validators.required),
    isProcessed:   this.fb.nonNullable.control(false),
    processedDate: this.fb.control<string | null>(null),
  });

  // ── Table columns ─────────────────────────────────────────────────────
  readonly displayedColumns = [
    'empCode', 'empName', 'loanType', 'payrollMonth',
    'monthlyInstallment', 'status', 'processedDate', 'actions',
  ];

  // ── Computed — monthly installment preview ─────────────────────────────
  readonly monthlyInstallmentPreview = computed(() => {
    const principal    = this.form.controls.principalAmount.value;
    const installments = this.form.controls.installments.value;
    if (!principal || !installments || installments <= 0) return null;
    return principal / installments;
  });

  // ── Computed — filtered table ──────────────────────────────────────────
  readonly filteredLoans = computed(() => {
    let rows = this._loans();

    const month = this.monthFilter();
    if (month) rows = rows.filter(r => r.payrollMonth === month);

    const loanTypeId = this.loanTypeFilter();
    if (loanTypeId) rows = rows.filter(r => r.loanId === loanTypeId);

    const status = this.statusFilter();
    if (status === 'pending')   rows = rows.filter(r => !r.isProcessed);
    if (status === 'processed') rows = rows.filter(r =>  r.isProcessed);

    const q = this.searchFilter().trim().toLowerCase();
    if (q) rows = rows.filter(r =>
      r.empCode.toLowerCase().includes(q)   ||
      r.empName.toLowerCase().includes(q)   ||
      r.loanName.toLowerCase().includes(q)  ||
      r.loanCode.toLowerCase().includes(q)
    );

    return rows;
  });

  // ── Computed — stats ───────────────────────────────────────────────────
  readonly totalCount     = computed(() => this._loans().length);
  readonly pendingCount   = computed(() => this._loans().filter(r => !r.isProcessed).length);
  readonly processedCount = computed(() => this._loans().filter(r =>  r.isProcessed).length);
  readonly totalAmount    = computed(() => this._loans().reduce((s, r) => s + r.amount, 0));
  readonly filteredTotal  = computed(() => this.filteredLoans().reduce((s, r) => s + r.amount, 0));

  readonly isFormOpen     = computed(() => this.formMode() !== 'none');

  // ── Lifecycle ─────────────────────────────────────────────────────────
  constructor() { this._loadAll(); }

  // ── Template helpers ──────────────────────────────────────────────────
  formatMonth(value: string): string { return formatMonthValue(value); }

  loanTypeName(id: number): string {
    return this.loanTypes().find(t => t.id === id)?.name ?? '—';
  }

  trackById(_: number, item: { id: number }): number { return item.id; }

  // ── Form actions ──────────────────────────────────────────────────────
  openCreate(): void {
    this._editId.set(null);
    this.form.reset({
      employeeId:      null,
      loanId:          null,
      principalAmount: null,
      installments:    null,
      payrollMonth:    this._currentMonth,
      isProcessed:     false,
      processedDate:   null,
    });
    this.saveError.set(null);
    this.formMode.set('create');
  }

  openEdit(row: LoanApplicationResponse): void {
    this._editId.set(row.id);
    this.form.reset({
      employeeId:      row.empId,
      loanId:          row.loanId,
      principalAmount: row.amount,   // in edit mode, amount IS the monthly installment
      installments:    1,
      payrollMonth:    row.payrollMonth,
      isProcessed:     row.isProcessed,
      processedDate:   row.processedDate ?? null,
    });
    this.saveError.set(null);
    this.formMode.set('edit');
  }

  cancelForm(): void {
    this.formMode.set('none');
    this.saveError.set(null);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving()) return;

    const raw     = this.form.getRawValue();
    const monthly = this.monthlyInstallmentPreview();
    if (!monthly) return;

    const body: LoanApplicationRequest = {
      empId:         raw.employeeId!,
      loanId:        raw.loanId!,
      amount:        monthly,
      payrollMonth:  raw.payrollMonth,
      isProcessed:   raw.isProcessed,
      processedDate: raw.isProcessed && raw.processedDate ? raw.processedDate : undefined,
      createdBy:     CURRENT_USER_ID,
      modifiedBy:    CURRENT_USER_ID,
    };

    this.saving.set(true);
    this.saveError.set(null);

    const mode   = this.formMode();
    const editId = this._editId();
    const call$  = mode === 'edit' && editId != null
      ? this.svc.update(editId, body)
      : this.svc.create(body);

    call$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: saved => {
          this.saving.set(false);
          if (mode === 'edit' && editId != null) {
            this._loans.update(rows => rows.map(r => r.id === editId ? saved : r));
          } else {
            this._loans.update(rows => [saved, ...rows]);
          }
          this.formMode.set('none');
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.saveError.set(err instanceof Error ? err.message : 'Save failed. Please try again.');
        },
      });
  }

  // ── Mark processed ─────────────────────────────────────────────────────
  markProcessed(row: LoanApplicationResponse): void {
    if (row.isProcessed || this.saving()) return;
    const body: LoanApplicationRequest = {
      empId:         row.empId,
      loanId:        row.loanId,
      amount:        row.amount,
      payrollMonth:  row.payrollMonth,
      isProcessed:   true,
      processedDate: new Date().toISOString().split('T')[0],
      createdBy:     CURRENT_USER_ID,
      modifiedBy:    CURRENT_USER_ID,
    };
    this.svc.update(row.id, body)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: saved => this._loans.update(rows => rows.map(r => r.id === row.id ? saved : r)),
      });
  }

  // ── Delete ─────────────────────────────────────────────────────────────
  confirmDelete(id: number): void  { this.pendingDeleteId.set(id); }
  cancelDelete(): void             { this.pendingDeleteId.set(null); }

  executeDelete(): void {
    const id = this.pendingDeleteId();
    if (id == null || this.deleting()) return;
    this.deleting.set(true);
    this.svc.delete(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this._loans.update(rows => rows.filter(r => r.id !== id));
          this.pendingDeleteId.set(null);
          this.deleting.set(false);
        },
        error: () => this.deleting.set(false),
      });
  }

  // ── Clear filters ─────────────────────────────────────────────────────
  clearFilters(): void {
    this.monthFilter.set(null);
    this.loanTypeFilter.set(null);
    this.statusFilter.set('all');
    this.searchFilter.set('');
  }

  readonly hasActiveFilters = computed(() =>
    this.monthFilter() !== null ||
    this.loanTypeFilter() !== null ||
    this.statusFilter() !== 'all' ||
    this.searchFilter().trim() !== ''
  );

  // ── Private ───────────────────────────────────────────────────────────
  private _loadAll(): void {
    this.loading.set(true);
    forkJoin({
      types: this.svc.getLoanTypes(),
      loans: this.svc.getAll(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ types, loans }) => {
          this.loanTypes.set(types);
          this._loans.set(loans);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
