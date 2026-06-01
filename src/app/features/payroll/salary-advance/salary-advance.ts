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
import { type EmployeeResponse } from '../../settings/employee/employee.model';
import { TableAutocomplete, type TableColumn } from '../../../shared/components/table-autocomplete/table-autocomplete';
import {
  SalaryAdvanceService,
  type EmployeeSalaryAdvanceRequest,
  type EmployeeSalaryAdvanceResponse,
} from './salary-advance.service';

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

// ── Component ─────────────────────────────────────────────────────────────

const CURRENT_USER_ID = 1; // TODO: replace with AuthService user id

@Component({
  selector: 'app-salary-advance',
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
  templateUrl: './salary-advance.html',
  styleUrl:    './salary-advance.scss',
})
export class SalaryAdvance {
  private readonly fb         = inject(FormBuilder);
  private readonly svc        = inject(SalaryAdvanceService);
  private readonly destroyRef = inject(DestroyRef);

  // ── Employee autocomplete ──────────────────────────────────────────────
  readonly employeeCols: TableColumn<EmployeeResponse>[] = [
    { key: 'employeeNo', label: 'Emp #'      },
    { key: 'firstName',  label: 'First Name' },
    { key: 'lastName',   label: 'Last Name'  },
  ];

  readonly empDisplayFn = (item: EmployeeResponse): string =>
    `${item.payrollName} — ${item.employeeNo}`;

  // ── Month options ──────────────────────────────────────────────────────
  private readonly _today = new Date();
  readonly monthOptions   = buildMonthOptions(this._today);

  private get _currentMonth(): string {
    return `${this._today.getFullYear()}-${String(this._today.getMonth() + 1).padStart(2, '0')}`;
  }

  // ── State ──────────────────────────────────────────────────────────────
  readonly loading   = signal(false);
  readonly saving    = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly deleting  = signal(false);

  private readonly _advances = signal<EmployeeSalaryAdvanceResponse[]>([]);

  readonly formMode        = signal<'none' | 'create' | 'edit'>('none');
  private readonly _editId = signal<number | null>(null);

  readonly pendingDeleteId = signal<number | null>(null);

  // Filters
  readonly monthFilter  = signal<string | null>(null);
  readonly searchFilter = signal('');

  // ── Form ──────────────────────────────────────────────────────────────
  readonly form = this.fb.group({
    employeeId:    this.fb.control<number | null>(null, Validators.required),
    amount:        this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    payrollMonth:  this.fb.nonNullable.control('', Validators.required),
    isProcessed:   this.fb.nonNullable.control(false),
    processedDate: this.fb.control<string | null>(null),
  });

  // ── Table columns ─────────────────────────────────────────────────────
  readonly displayedColumns = [
    'empCode', 'empName', 'payrollMonth', 'amount', 'status', 'processedDate', 'actions',
  ];

  // ── Computed ──────────────────────────────────────────────────────────
  readonly filteredAdvances = computed(() => {
    let rows = this._advances();
    const month = this.monthFilter();
    if (month) rows = rows.filter(r => r.payrollMonth === month);
    const q = this.searchFilter().trim().toLowerCase();
    if (q) rows = rows.filter(r =>
      r.empCode.toLowerCase().includes(q) ||
      r.empName.toLowerCase().includes(q)
    );
    return rows;
  });

  readonly grandTotal = computed(() =>
    this.filteredAdvances().reduce((s, r) => s + r.amount, 0)
  );

  readonly isFormOpen = computed(() => this.formMode() !== 'none');

  // ── Lifecycle ─────────────────────────────────────────────────────────
  constructor() { this._load(); }

  // ── Template helpers ──────────────────────────────────────────────────
  formatMonth(value: string): string { return formatMonthValue(value); }

  onEmpSelected(item: unknown): void {
    // item is emitted for side-effects; the form already holds the id via CVA
    void item;
  }

  // ── Form actions ──────────────────────────────────────────────────────
  openCreate(): void {
    this._editId.set(null);
    this.form.reset({
      employeeId:    null,
      amount:        null,
      payrollMonth:  this._currentMonth,
      isProcessed:   false,
      processedDate: null,
    });
    this.saveError.set(null);
    this.formMode.set('create');
  }

  openEdit(row: EmployeeSalaryAdvanceResponse): void {
    this._editId.set(row.id);
    this.form.reset({
      employeeId:    row.empId,
      amount:        row.amount,
      payrollMonth:  row.payrollMonth,
      isProcessed:   row.isProcessed,
      processedDate: row.processedDate ?? null,
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

    const raw  = this.form.getRawValue();
    const body: EmployeeSalaryAdvanceRequest = {
      empId:         raw.employeeId!,
      amount:        raw.amount!,
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
            this._advances.update(rows => rows.map(r => r.id === editId ? saved : r));
          } else {
            this._advances.update(rows => [saved, ...rows]);
          }
          this.formMode.set('none');
        },
        error: (err: unknown) => {
          this.saving.set(false);
          this.saveError.set(err instanceof Error ? err.message : 'Save failed. Please try again.');
        },
      });
  }

  // ── Delete ────────────────────────────────────────────────────────────
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
          this._advances.update(rows => rows.filter(r => r.id !== id));
          this.pendingDeleteId.set(null);
          this.deleting.set(false);
        },
        error: () => this.deleting.set(false),
      });
  }

  // ── Private ───────────────────────────────────────────────────────────
  private _load(): void {
    this.loading.set(true);
    this.svc.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  rows => { this._advances.set(rows); this.loading.set(false); },
        error: ()   => this.loading.set(false),
      });
  }
}
