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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EmployeeProfileService } from '../employee-profile.service';
import { EmployeeFixedDeductionAssignRequest } from './employee-fixed-deduction.model';
import { EmployeeFixedDeductionService } from './employee-fixed-deduction.service';

interface DeductionRow {
  fdId: number;
  fdCode: string;
  fdName: string;
  selected: boolean;
  amount: number;
}

@Component({
  selector: 'app-employee-deductions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    MatCheckboxModule,
    MatDividerModule,
    MatIconModule,
  ],
  templateUrl: './employee-fixed-deduction.component.html',
  styleUrl: './employee-fixed-deduction.component.scss',
})
export class EmployeeDeductions {
  private readonly profileSvc = inject(EmployeeProfileService);
  private readonly empFdSvc   = inject(EmployeeFixedDeductionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar   = inject(MatSnackBar);

  readonly empId = input<number | null>(null);

  readonly rows    = signal<DeductionRow[]>([]);
  readonly loading = signal(false);
  readonly saving  = signal(false);

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
            fdId:     d.fdId,
            fdCode:   d.fdCode,
            fdName:   d.fdName,
            selected: d.isAssigned,
            amount:   d.amount ?? 0,
          })));
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  toggleSelected(fdId: number, selected: boolean): void {
    // Reflect the checkbox state immediately.
    this.rows.update(list =>
      list.map(r => r.fdId === fdId ? { ...r, selected } : r)
    );

    if (!selected) {
      // Unchecked: zero out the amount right away, no formula evaluation needed.
      this.rows.update(list =>
        list.map(r => r.fdId === fdId ? { ...r, amount: 0 } : r)
      );
      return;
    }

    // Checked: ask the server to evaluate the deduction's formula for this employee
    // (zero when no formula is configured), and populate the row's amount with the result.
    const empId = this.empId();
    if (empId == null) return;

    this.empFdSvc.previewAmount(empId, fdId, this.payrollMonth)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: preview => {
          this.rows.update(list =>
            list.map(r => r.fdId === fdId ? { ...r, amount: preview.result ?? 0 } : r)
          );
          if (preview.userFriendlyError) {
            this.snackBar.open(preview.userFriendlyError, 'Close', { duration: 3500 });
          }
        },
        error: () => {
          this.rows.update(list =>
            list.map(r => r.fdId === fdId ? { ...r, amount: 0 } : r)
          );
          this.snackBar.open('Could not calculate the deduction amount.', 'Close', { duration: 3000 });
        },
      });
  }

  save(): void {
    const empId = this.empId();
    if (empId == null || this.saving()) return;

    const payload: EmployeeFixedDeductionAssignRequest = {
      payrollMonth: this.payrollMonth,
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
