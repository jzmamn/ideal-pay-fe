import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmployeeProfileService } from '../employee-profile.service';
import { EmployeeFixedDeductionAssignRequest } from './employee-fixed-deduction.model';

/** One row of the Employee → Salary Tab → Fixed Deduction checkbox grid (local editable state). */
interface DeductionRow {
  fdId: number;
  fdCode: string;
  fdName: string;
  formulaCalculated: boolean;
  selected: boolean;
  amount: number;
}

/**
 * Employee → Salary Tab → Fixed Deduction checkbox grid.
 *
 * Fixed Deductions are never automatically assigned to an employee — the user must
 * explicitly check a deduction for it to be saved to `emp_fd`. Unchecking a previously
 * assigned deduction and saving removes its `emp_fd` record for this employee/month.
 * Amounts derived from a formula (`formulaCalculated`) remain read-only, matching the
 * existing behaviour for formula-driven amounts.
 */
@Component({
  selector: 'app-employee-deductions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatTooltipModule,
  ],
  templateUrl: './employee-fixed-deduction.component.html',
  styleUrl: './employee-fixed-deduction.component.scss',
})
export class EmployeeDeductions {
  private readonly profileSvc = inject(EmployeeProfileService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar   = inject(MatSnackBar);

  readonly empId = input<number | null>(null);

  readonly rows    = signal<DeductionRow[]>([]);
  readonly loading = signal(false);
  readonly saving  = signal(false);

  /** No payroll-period selector exists on this screen — assignments are read/written against the current calendar month. */
  private readonly today = new Date();
  readonly payrollMonth = `${this.today.getFullYear()}-${String(this.today.getMonth() + 1).padStart(2, '0')}`;

  readonly selectedCount = computed(() => this.rows().filter(r => r.selected).length);

  readonly totalFixedDeduction = computed(() =>
    this.rows().filter(r => r.selected).reduce((sum, r) => sum + (r.amount || 0), 0)
  );

  constructor() {
    effect(() => {
      const id = this.empId();
      if (id != null) {
        this.loadRows(id);
      } else {
        this.rows.set([]);
      }
    });
  }

  private loadRows(empId: number): void {
    this.loading.set(true);
    this.profileSvc.getEmployeeProfileByEmployee(empId, false, this.payrollMonth)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: profile => {
          this.rows.set(profile.fixedDeductions.map(d => ({
            fdId:              d.fdId,
            fdCode:            d.fdCode,
            fdName:            d.fdName,
            formulaCalculated: d.formulaCalculated,
            selected:          d.isAssigned,
            amount:            d.amount ?? 0,
          })));
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  toggleSelected(fdId: number, selected: boolean): void {
    this.rows.update(list =>
      list.map(r => r.fdId === fdId ? { ...r, selected } : r)
    );
  }

  updateAmount(fdId: number, value: number | null): void {
    this.rows.update(list =>
      list.map(r => r.fdId === fdId ? { ...r, amount: value ?? 0 } : r)
    );
  }

  save(): void {
    const empId = this.empId();
    if (empId == null || this.saving()) return;

    const payload: EmployeeFixedDeductionAssignRequest = {
      payrollMonth: this.payrollMonth,
      createdBy:    1,
      modifiedBy:   1,
      selections: this.rows()
        .filter(r => r.selected)
        .map(r => ({ fdId: r.fdId, amount: r.amount || 0 })),
    };

    this.saving.set(true);
    this.profileSvc.assignFixedDeductions(empId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Fixed deductions updated.', 'Close', { duration: 2500 });
          this.loadRows(empId);
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Failed to update fixed deductions.', 'Close', { duration: 3000 });
        },
      });
  }
}
