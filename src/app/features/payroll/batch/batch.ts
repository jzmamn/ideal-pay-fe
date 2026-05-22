import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef,
  computed, effect, inject, signal, untracked, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatDividerModule } from '@angular/material/divider';
import { EmployeeService } from '../../settings/employee/employee.service';
import { BatchService, BatchEntry, BatchSavePayload } from './batch.service';

// ── Per-category column codes ────────────────────────────────────────────
const FIXED_ALW_CODES  = ['FAlw1', 'FAlw2', 'FAlw3', 'FAlw4', 'FAlw5'] as const;
const VAR_ALW_CODES    = ['VAlw1', 'VAlw2', 'VAlw3', 'VAlw4', 'VAlw5'] as const;
const OT_CODES         = ['OT1',   'OT2',   'OT3'  ] as const;
const FIXED_DED_CODES  = ['FDed1', 'FDed2', 'FDed3'] as const;
const VAR_DED_CODES    = ['VDed1', 'VDed2', 'VDed3'] as const;
const NOPAY_CODES      = ['NoPay'] as const;
const LOAN_CODES       = ['Loan1', 'Loan2', 'Loan3'] as const;
const BONUS_CODES      = ['Perf', 'Festival', 'Annual', 'Referral'] as const;

const SUB_STEPS = [
  { key: 'fixedAlw', label: 'Fixed Allowance',   codes: FIXED_ALW_CODES  },
  { key: 'varAlw',   label: 'Variable Allowance', codes: VAR_ALW_CODES    },
  { key: 'overtime', label: 'Overtime',           codes: OT_CODES         },
  { key: 'fixedDed', label: 'Fixed Deduction',    codes: FIXED_DED_CODES  },
  { key: 'varDed',   label: 'Variable Deduction', codes: VAR_DED_CODES    },
  { key: 'nopay',    label: 'NoPay',              codes: NOPAY_CODES      },
  { key: 'loans',    label: 'Loans',              codes: LOAN_CODES       },
  { key: 'bonus',    label: 'Bonus',              codes: BONUS_CODES      },
] as const;

interface BatchEmployee { id: number; code: string; name: string; }
type AmountMatrix = Record<string, number[]>; // code → [empIndex → amount]

const MOCK_EMPLOYEES: BatchEmployee[] = [
  { id:  1, code: 'Emp0001', name: 'John Doe'    },
  { id:  2, code: 'Emp0002', name: 'Alan Border' },
  { id:  3, code: 'Emp0003', name: 'John Doe'    },
  { id:  4, code: 'Emp0004', name: 'Alan Border' },
  { id:  5, code: 'Emp0005', name: 'John Doe'    },
  { id:  6, code: 'Emp0006', name: 'Alan Border' },
  { id:  7, code: 'Emp0007', name: 'John Doe'    },
  { id:  8, code: 'Emp0008', name: 'Alan Border' },
  { id:  9, code: 'Emp0009', name: 'John Doe'    },
  { id: 10, code: 'Emp0010', name: 'Alan Border' },
  { id: 11, code: 'Emp0011', name: 'John Doe'    },
  { id: 12, code: 'Emp0012', name: 'Alan Border' },
  { id: 13, code: 'Emp0013', name: 'John Doe'    },
  { id: 14, code: 'Emp0014', name: 'Alan Border' },
];

// Fast lookup: code string → category key
const CODE_TO_CAT: Record<string, string> = Object.fromEntries(
  SUB_STEPS.flatMap(s => (s.codes as readonly string[]).map(c => [c, s.key]))
);

function buildCatMatrix(emps: BatchEmployee[], codes: readonly string[]): AmountMatrix {
  return Object.fromEntries(codes.map(code => [code, emps.map(() => 0)]));
}

function buildAllMatrices(emps: BatchEmployee[]): Record<string, AmountMatrix> {
  return Object.fromEntries(
    SUB_STEPS.map(step => [step.key, buildCatMatrix(emps, step.codes)])
  );
}

@Component({
  selector: 'app-batch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, NgTemplateOutlet, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    MatStepperModule, MatDividerModule,
  ],
  templateUrl: './batch.html',
  styleUrl:    './batch.scss',
})
export class BatchComponent {
  private readonly fb         = inject(FormBuilder);
  private readonly cdr        = inject(ChangeDetectorRef);
  private readonly empSvc     = inject(EmployeeService);
  private readonly batchSvc   = inject(BatchService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly stepper    = viewChild.required<MatStepper>('stepper');
  private readonly _editInput = viewChild<ElementRef<HTMLInputElement>>('editInputEl');

  readonly SUB_STEPS = SUB_STEPS;

  private readonly _today = new Date();

  readonly months = [
    { value:  1, label: 'January'   }, { value:  2, label: 'February'  },
    { value:  3, label: 'March'     }, { value:  4, label: 'April'     },
    { value:  5, label: 'May'       }, { value:  6, label: 'June'      },
    { value:  7, label: 'July'      }, { value:  8, label: 'August'    },
    { value:  9, label: 'September' }, { value: 10, label: 'October'   },
    { value: 11, label: 'November'  }, { value: 12, label: 'December'  },
  ];

  readonly years = [
    this._today.getFullYear() - 1,
    this._today.getFullYear(),
    this._today.getFullYear() + 1,
  ];

  readonly periodForm = this.fb.group({
    month: this.fb.nonNullable.control(
      this._today.getMonth() + 1,
      [Validators.required, Validators.min(1)],
    ),
    year: this.fb.nonNullable.control(
      this._today.getFullYear(),
      Validators.required,
    ),
  });

  readonly editingCell       = signal<{ cat: string; empIndex: number; code: string } | null>(null);
  readonly saving            = signal(false);
  readonly saveError         = signal<string | null>(null);
  readonly saveSuccess       = signal(false);
  readonly loading           = signal(false);
  readonly isReviewConfirmed = signal(false);
  readonly isApproved        = signal(false);

  readonly approveForm = this.fb.group({
    approvedBy: this.fb.nonNullable.control('', Validators.required),
    remarks:    this.fb.nonNullable.control(''),
  });

  readonly editCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(0)],
  });

  private readonly _matrices = signal<Record<string, AmountMatrix>>(
    buildAllMatrices(MOCK_EMPLOYEES)
  );

  readonly employees = computed<BatchEmployee[]>(() => {
    const real = this.empSvc.employees();
    return real.length
      ? real.map(e => ({ id: e.id, code: e.employeeNo, name: `${e.firstName} ${e.lastName}` }))
      : MOCK_EMPLOYEES;
  });

  readonly catColTotals = computed(() => {
    const m = this._matrices();
    return Object.fromEntries(
      SUB_STEPS.map(step => [
        step.key,
        Object.fromEntries(
          (step.codes as readonly string[]).map(code => [
            code,
            (m[step.key]?.[code] ?? []).reduce((s, v) => s + v, 0),
          ])
        ),
      ])
    );
  });

  readonly catTotals = computed(() => {
    const ct = this.catColTotals();
    return Object.fromEntries(
      SUB_STEPS.map(step => [
        step.key,
        Object.values(ct[step.key] ?? {}).reduce((s, v) => s + v, 0),
      ])
    );
  });

  readonly grandTotal = computed(() =>
    Object.values(this.catTotals()).reduce((s, v) => s + v, 0)
  );

  get periodLabel(): string {
    const { month, year } = this.periodForm.getRawValue();
    const m = this.months.find(x => x.value === month);
    return `${m?.label ?? ''} ${year}`;
  }

  constructor() {
    this.empSvc.reload();

    effect(() => {
      const emps = this.employees();
      if (!emps.length) return;
      this._matrices.set(buildAllMatrices(emps));
      untracked(() => this._loadValues());
    });
  }

  // ── Cell helpers ──────────────────────────────────────────────────────

  isEditing(cat: string, empIndex: number, code: string): boolean {
    const c = this.editingCell();
    return c?.cat === cat && c?.empIndex === empIndex && c?.code === code;
  }

  getAmount(cat: string, code: string, empIndex: number): number {
    return this._matrices()[cat]?.[code]?.[empIndex] ?? 0;
  }

  getCatColTotal(cat: string, code: string): number {
    return this.catColTotals()[cat]?.[code] ?? 0;
  }

  // ── Inline cell editing ───────────────────────────────────────────────

  startCellEdit(cat: string, empIndex: number, code: string): void {
    if (this.editingCell()) this.saveCellEdit();
    this.editCtrl.setValue(this.getAmount(cat, code, empIndex));
    this.editingCell.set({ cat, empIndex, code });
    queueMicrotask(() => this._editInput()?.nativeElement.focus());
  }

  saveCellEdit(): void {
    const cell = this.editingCell();
    if (!cell) return;
    const amount = Math.max(0, Number(this.editCtrl.value ?? 0));
    const { cat, empIndex, code } = cell;
    this._matrices.update(prev => {
      const catMatrix = { ...(prev[cat] ?? {}) };
      const col = [...(catMatrix[code] ?? [])];
      col[empIndex] = amount;
      catMatrix[code] = col;
      return { ...prev, [cat]: catMatrix };
    });
    this.editingCell.set(null);
  }

  cancelCellEdit(): void { this.editingCell.set(null); }

  confirmReview(): void {
    this.isReviewConfirmed.set(true);
    this.cdr.detectChanges();
    this.stepper().next();
  }

  approvePayroll(): void {
    this.approveForm.markAllAsTouched();
    if (this.approveForm.invalid) return;
    this.isApproved.set(true);
    this.cdr.detectChanges();
    this.stepper().next();
  }

  // ── Period change ──────────────────────────────────────────────────────

  onPeriodChange(): void {
    this.editingCell.set(null);
    this._matrices.set(buildAllMatrices(this.employees()));
    this._loadValues();
  }

  // ── Save ───────────────────────────────────────────────────────────────

  save(): void {
    if (this.saving() || this.periodForm.invalid) return;
    this.saveCellEdit();
    this.saving.set(true);
    this.saveError.set(null);
    this.saveSuccess.set(false);

    const { month, year } = this.periodForm.getRawValue();
    const emps    = this.employees();
    const matrices = this._matrices();

    const entries: BatchEntry[] = SUB_STEPS.flatMap(step =>
      (step.codes as readonly string[]).flatMap(code =>
        emps.map((emp, i) => ({
          allowanceCode: code,
          employeeId:    emp.id,
          amount:        matrices[step.key]?.[code]?.[i] ?? 0,
        }))
      )
    );

    const payload: BatchSavePayload = { periodMonth: month, periodYear: year, entries };

    this.batchSvc.save(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.saving.set(false); this.saveSuccess.set(true); },
        error: (err: unknown) => {
          this.saving.set(false);
          this.saveError.set(err instanceof Error ? err.message : 'Save failed. Please try again.');
        },
      });
  }

  // ── Private ────────────────────────────────────────────────────────────

  private _loadValues(): void {
    const { month, year } = this.periodForm.getRawValue();
    this.loading.set(true);

    this.batchSvc.load(month, year)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: entries => {
          this.loading.set(false);
          if (!entries.length) return;
          const emps = this.employees();
          this._matrices.update(prev => {
            const next = { ...prev };
            for (const entry of entries) {
              const cat = CODE_TO_CAT[entry.allowanceCode];
              if (!cat) continue;
              const empIndex = emps.findIndex(e => e.id === entry.employeeId);
              if (empIndex < 0) continue;
              const catMatrix = { ...(next[cat] ?? {}) };
              const col = [...(catMatrix[entry.allowanceCode] ?? [])];
              col[empIndex] = entry.amount;
              catMatrix[entry.allowanceCode] = col;
              next[cat] = catMatrix;
            }
            return next;
          });
        },
        error: () => this.loading.set(false),
      });
  }
}
