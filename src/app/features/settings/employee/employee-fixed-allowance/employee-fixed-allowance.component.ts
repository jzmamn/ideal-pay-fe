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
import { EmployeeFixedAllowanceAssignRequest } from './employee-fixed-allowance.model';

/** One row of the Employee → Salary Tab → Fixed Allowance checkbox grid (local editable state). */
interface AllowanceRow {
  faId: number;
  faCode: string;
  faName: string;
  formulaCalculated: boolean;
  selected: boolean;
  amount: number;
}

@Component({
  selector: 'app-employee-allowances',
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
  templateUrl: './employee-fixed-allowance.component.html',
  styleUrl: './employee-fixed-allowance.component.scss',
})
export class EmployeeAllowances {
  private readonly profileSvc = inject(EmployeeProfileService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar   = inject(MatSnackBar);

  readonly empId = input<number | null>(null);

  readonly rows   = signal<AllowanceRow[]>([]);
  readonly loading = signal(false);
  readonly saving  = signal(false);

  /** No payroll-period selector exists on this screen — assignments are read/written against the current calendar month. */
  private readonly today = new Date();
  readonly payrollMonth = `${this.today.getFullYear()}-${String(this.today.getMonth() + 1).padStart(2, '0')}`;

  readonly selectedCount = computed(() => this.rows().filter(r => r.selected).length);

  readonly totalFixedAllowance = computed(() =>
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
          this.rows.set(profile.fixedAllowances.map(a => ({
            faId:              a.faId,
            faCode:            a.faCode,
            faName:            a.faName,
            formulaCalculated: a.formulaCalculated,
            selected:          a.isAssigned,
            amount:            a.amount ?? 0,
          })));
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  toggleSelected(faId: number, selected: boolean): void {
    this.rows.update(list =>
      list.map(r => r.faId === faId ? { ...r, selected } : r)
    );
  }

  updateAmount(faId: number, value: number | null): void {
    this.rows.update(list =>
      list.map(r => r.faId === faId ? { ...r, amount: value ?? 0 } : r)
    );
  }

  save(): void {
    const empId = this.empId();
    if (empId == null || this.saving()) return;

    const payload: EmployeeFixedAllowanceAssignRequest = {
      payrollMonth: this.payrollMonth,
      createdBy:    1,
      modifiedBy:   1,
      selections: this.rows()
        .filter(r => r.selected)
        .map(r => ({ faId: r.faId, amount: r.amount || 0 })),
    };

    this.saving.set(true);
    this.profileSvc.assignFixedAllowances(empId, payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.snackBar.open('Fixed allowances updated.', 'Close', { duration: 2500 });
          this.loadRows(empId);
        },
        error: () => {
          this.saving.set(false);
          this.snackBar.open('Failed to update fixed allowances.', 'Close', { duration: 3000 });
        },
      });
  }
}
