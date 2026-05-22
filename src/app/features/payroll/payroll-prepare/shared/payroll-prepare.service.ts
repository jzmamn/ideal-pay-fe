import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { lastValueFrom, map } from 'rxjs';
import { PayrollEntryRow, ApiEnvelope } from '../payroll.models';
import { ToastService } from './toast.service';

const API = '/api/v1';

const MOCK_ENTRIES: PayrollEntryRow[] = [
  { id: 1, employeeId: 1, empCode: 'EMP001', fullName: 'Amal Perera',    department: 'Engineering',  designation: 'Software Engineer',   basicPay: 85000,  grossPay: 102000, totalDeductions: 18700, netPay: 83300,  overrides: [] },
  { id: 2, employeeId: 2, empCode: 'EMP002', fullName: 'Nimal Silva',    department: 'Engineering',  designation: 'Senior Engineer',     basicPay: 120000, grossPay: 148000, totalDeductions: 27500, netPay: 120500, overrides: [] },
  { id: 3, employeeId: 3, empCode: 'EMP003', fullName: 'Kamala Fernando',department: 'HR',           designation: 'HR Manager',          basicPay: 95000,  grossPay: 113000, totalDeductions: 20800, netPay: 92200,  overrides: [] },
  { id: 4, employeeId: 4, empCode: 'EMP004', fullName: 'Sunil Jayasinghe',department: 'Finance',    designation: 'Finance Analyst',     basicPay: 78000,  grossPay:  93600, totalDeductions: 17200, netPay: 76400,  overrides: [] },
  { id: 5, employeeId: 5, empCode: 'EMP005', fullName: 'Dilani Rathnayake',department: 'Sales',     designation: 'Sales Executive',     basicPay: 65000,  grossPay:  79000, totalDeductions: 14500, netPay: 64500,  overrides: [] },
  { id: 6, employeeId: 6, empCode: 'EMP006', fullName: 'Roshan Kumara',  department: 'Operations', designation: 'Operations Lead',      basicPay: 110000, grossPay: 135000, totalDeductions: 24900, netPay: 110100, overrides: [] },
];

@Injectable({ providedIn: 'root' })
export class PayrollPrepareService {
  private readonly http   = inject(HttpClient);
  private readonly route  = inject(ActivatedRoute);
  private readonly toast  = inject(ToastService);

  private readonly _today = new Date();

  readonly months = [
    { value:  1, label: 'January'   }, { value:  2, label: 'February'  },
    { value:  3, label: 'March'     }, { value:  4, label: 'April'     },
    { value:  5, label: 'May'       }, { value:  6, label: 'June'      },
    { value:  7, label: 'July'      }, { value:  8, label: 'August'    },
    { value:  9, label: 'September' }, { value: 10, label: 'October'   },
    { value: 11, label: 'November'  }, { value: 12, label: 'December'  },
  ];

  readonly years: number[] = [
    this._today.getFullYear() - 1,
    this._today.getFullYear(),
    this._today.getFullYear() + 1,
  ];

  readonly periodMonth = signal<number>(this._today.getMonth() + 1);
  readonly periodYear  = signal<number>(this._today.getFullYear());

  readonly periodLabel = computed(() => {
    const month = this.months.find(m => m.value === this.periodMonth());
    return `${month?.label ?? ''} ${this.periodYear()}`;
  });

  readonly runId = toSignal(
    this.route.paramMap.pipe(map(p => Number(p.get('runId')))),
    { initialValue: 0 },
  );

  private readonly _entries = signal<PayrollEntryRow[]>([]);
  private readonly _dirty   = signal<Set<number>>(new Set());
  private readonly _loading = signal(false);

  readonly entries       = this._entries.asReadonly();
  readonly loading       = this._loading.asReadonly();
  readonly dirtyCount    = computed(() => this._dirty().size);

  readonly employeeCount = computed(() => this._entries().length);
  readonly grossTotal    = computed(() =>
    this._entries().reduce((sum, r) => sum + r.grossPay, 0));
  readonly dedTotal      = computed(() =>
    this._entries().reduce((sum, r) => sum + r.totalDeductions, 0));
  readonly netTotal      = computed(() => this.grossTotal() - this.dedTotal());

  async loadEntries(): Promise<void> {
    this._loading.set(true);
    try {
      const res = await lastValueFrom(
        this.http.get<ApiEnvelope<PayrollEntryRow[]>>(
          `${API}/payroll-runs/${this.runId()}/entries`,
        ),
      );
      this._entries.set(res.data?.length ? res.data : MOCK_ENTRIES);
      this._dirty.set(new Set());
    } catch {
      this._entries.set(MOCK_ENTRIES);
      this._dirty.set(new Set());
    } finally {
      this._loading.set(false);
    }
  }

  updateRow(id: number, field: string, value: unknown): void {
    this._entries.update(rows =>
      rows.map(r => r.id === id ? { ...r, [field]: value } : r),
    );
    this._dirty.update(s => new Set([...s, id]));
  }

  async saveAll(): Promise<void> {
    const dirtyIds = [...this._dirty()];
    if (!dirtyIds.length) return;
    const payload = this._entries().filter(r => dirtyIds.includes(r.id));
    try {
      await lastValueFrom(
        this.http.put<ApiEnvelope<void>>(
          `${API}/payroll-runs/${this.runId()}/entries/bulk`,
          payload,
        ),
      );
      this._dirty.set(new Set());
      this.toast.success('Changes saved.');
      await this.recalculate();
    } catch {
      this.toast.error('Save failed. Please try again.');
      throw new Error('save failed');
    }
  }

  async recalculate(): Promise<void> {
    try {
      await lastValueFrom(
        this.http.post<ApiEnvelope<void>>(
          `${API}/payroll-runs/${this.runId()}/recalculate`,
          {},
        ),
      );
      await this.loadEntries();
    } catch {
      this.toast.error('Recalculation failed.');
    }
  }

  async recalculateTax(): Promise<void> {
    try {
      await lastValueFrom(
        this.http.post<ApiEnvelope<void>>(
          `${API}/payroll-runs/${this.runId()}/recalculate-tax`,
          {},
        ),
      );
      await this.loadEntries();
      this.toast.success('TDS recalculated.');
    } catch {
      this.toast.error('TDS recalculation failed.');
    }
  }

  async submit(): Promise<void> {
    await lastValueFrom(
      this.http.post<ApiEnvelope<void>>(
        `${API}/payroll-runs/${this.runId()}/submit`,
        {},
      ),
    );
  }
}
