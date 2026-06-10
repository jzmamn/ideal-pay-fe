import {
  ChangeDetectionStrategy, Component, DestroyRef,
  computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { RunReviewService } from './run-review.service';
import { RunReviewRow } from './run-review.model';

// ── Constants ──────────────────────────────────────────────────────────────

const COMPONENT_TYPE_LABELS: Record<string, string> = {
  FA:    'Fixed Allowance',
  FD:    'Fixed Deduction',
  VA:    'Variable Allowance',
  VD:    'Variable Deduction',
  OT:    'Overtime',
  NOPAY: 'NoPay',
  SA:    'Salary Advance',
};

// ── Component ──────────────────────────────────────────────────────────────

@Component({
  selector: 'app-run-review',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe, ReactiveFormsModule,
    MatButtonModule, MatFormFieldModule, MatIconModule,
    MatInputModule, MatProgressSpinnerModule, MatSelectModule,
    MatTooltipModule, MatChipsModule,
  ],
  templateUrl: './run-review.html',
  styleUrl:    './run-review.scss',
})
export class RunReviewComponent {
  /** Exposed so the template can call Math.abs(). */
  readonly Math = Math;

  private readonly svc        = inject(RunReviewService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb         = inject(FormBuilder);

  // ── Period selectors ───────────────────────────────────────────────────
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
    month: this.fb.nonNullable.control(this._today.getMonth() + 1),
    year:  this.fb.nonNullable.control(this._today.getFullYear()),
  });

  // ── State ──────────────────────────────────────────────────────────────
  readonly loading  = signal(false);
  readonly error    = signal<string | null>(null);
  readonly rows     = signal<RunReviewRow[]>([]);
  readonly search   = signal('');

  /** Filter: 'all' | component type key */
  readonly typeFilter = signal<string>('all');

  // ── Derived ────────────────────────────────────────────────────────────

  readonly isLocked = computed(() =>
    this.rows().length > 0 &&
    this.rows().every(r => r.runStatus === 'LOCKED' || r.runStatus === 'CORRECTION_LOCKED')
  );

  readonly availableTypes = computed(() => {
    const types = new Set(this.rows().map(r => r.componentType));
    return ['all', ...Array.from(types)];
  });

  readonly filteredRows = computed(() => {
    const q    = this.search().toLowerCase().trim();
    const type = this.typeFilter();
    return this.rows().filter(r => {
      const matchType   = type === 'all' || r.componentType === type;
      const matchSearch = !q ||
        r.empId.toLowerCase().includes(q) ||
        r.empName.toLowerCase().includes(q) ||
        r.componentName.toLowerCase().includes(q) ||
        r.componentCode.toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  });

  readonly totalDifference = computed(() =>
    this.filteredRows().reduce((s, r) => s + r.difference, 0));

  readonly diffCount = computed(() =>
    this.filteredRows().filter(r => Math.abs(r.difference) > 0.005).length);

  readonly formulaCount = computed(() =>
    this.filteredRows().filter(r => r.hasFormula === 'Y').length);

  // ── Period label ───────────────────────────────────────────────────────

  get periodLabel(): string {
    const { month, year } = this.periodForm.getRawValue();
    return `${this.months.find(x => x.value === month)?.label ?? ''} ${year}`;
  }

  private get payrollMonth(): string {
    const { month, year } = this.periodForm.getRawValue();
    return `${year}-${String(month).padStart(2, '0')}`;
  }

  // ── Actions ────────────────────────────────────────────────────────────

  load(): void {
    if (this.loading()) return;
    this.error.set(null);
    this.rows.set([]);
    this.search.set('');
    this.typeFilter.set('all');
    this.loading.set(true);

    this.svc.getReview(this.payrollMonth)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  rows => { this.loading.set(false); this.rows.set(rows); },
        error: ()   => {
          this.loading.set(false);
          this.error.set('Failed to load review data. Make sure the payroll has been processed for this month.');
        },
      });
  }

  onSearchInput(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  typeLabel(type: string): string {
    return type === 'all' ? 'All Types' : (COMPONENT_TYPE_LABELS[type] ?? type);
  }

  diffClass(diff: number): string {
    if (Math.abs(diff) < 0.005) return 'diff-zero';
    return diff > 0 ? 'diff-positive' : 'diff-negative';
  }
}
