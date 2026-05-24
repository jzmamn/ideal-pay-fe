import {
  ChangeDetectionStrategy, Component, DestroyRef,
  computed, effect, inject, signal, untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { EmployeeService } from '../../settings/employee/employee.service';
import { BatchService, BatchEntry, BatchSavePayload } from './batch.service';
import { PivotComponent, PivotAmountChange } from '../../../shared/components/pivot/pivot';

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
type AmountMatrix = Record<string, number[]>;

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
    DecimalPipe, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    MatTabsModule,
    PivotComponent,
  ],
  templateUrl: './batch.html',
  styleUrl:    './batch.scss',
})
export class BatchComponent {
  private readonly fb         = inject(FormBuilder);
  private readonly empSvc     = inject(EmployeeService);
  private readonly batchSvc   = inject(BatchService);
  private readonly destroyRef = inject(DestroyRef);

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

  readonly saving          = signal(false);
  readonly saveError       = signal<string | null>(null);
  readonly saveSuccess     = signal(false);
  readonly loading         = signal(false);
  readonly selectedSubStep = signal(0);

  private readonly _matrices = signal<Record<string, AmountMatrix>>(
    buildAllMatrices(MOCK_EMPLOYEES)
  );

  readonly employees = computed<BatchEmployee[]>(() => {
    const real = this.empSvc.employees();
    return real.length
      ? real.map(e => ({ id: e.id, code: e.employeeNo, name: `${e.firstName} ${e.lastName}` }))
      : MOCK_EMPLOYEES;
  });

  readonly pivotRows = computed(() =>
    this.employees().map((emp, idx) => ({ emp, idx }))
  );

  readonly grandTotal = computed(() =>
    SUB_STEPS.reduce((sum, step) => {
      const mat = this._matrices()[step.key] ?? {};
      return sum + (step.codes as readonly string[]).reduce((s, code) =>
        s + (mat[code] ?? []).reduce((a, v) => a + v, 0), 0);
    }, 0)
  );

  readonly matrices = computed(() => this._matrices());

  get periodLabel(): string {
    const { month, year } = this.periodForm.getRawValue();
    return `${this.months.find(x => x.value === month)?.label ?? ''} ${year}`;
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

  onAmountChange(catKey: string, e: PivotAmountChange): void {
    this._matrices.update(prev => {
      const cat = { ...(prev[catKey] ?? {}) };
      const col = [...(cat[e.code] ?? [])];
      col[e.empIndex] = e.amount;
      cat[e.code] = col;
      return { ...prev, [catKey]: cat };
    });
  }

  onPeriodChange(): void {
    this._matrices.set(buildAllMatrices(this.employees()));
    this._loadValues();
  }

  save(): void {
    if (this.saving() || this.periodForm.invalid) return;
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

    this.batchSvc.save({ periodMonth: month, periodYear: year, entries } satisfies BatchSavePayload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  ()           => { this.saving.set(false); this.saveSuccess.set(true); },
        error: (err: unknown) => {
          this.saving.set(false);
          this.saveError.set(err instanceof Error ? err.message : 'Save failed. Please try again.');
        },
      });
  }

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
