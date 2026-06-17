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
import { EmployeeFixedAllowanceAssignRequest } from './employee-fixed-allowance.model';
import { EmployeeFixedAllowanceService } from './employee-fixed-allowance.service';

interface AllowanceRow {
  faId: number;
  faCode: string;
  faName: string;
  selected: boolean;
  amount: number;
}

@Component({
  selector: 'app-employee-allowances',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    MatCheckboxModule,
    MatDividerModule,
    MatIconModule,
  ],
  templateUrl: './employee-fixed-allowance.component.html',
  styleUrl: './employee-fixed-allowance.component.scss',
})
export class EmployeeAllowances {
  private readonly profileSvc = inject(EmployeeProfileService);
  private readonly empFaSvc   = inject(EmployeeFixedAllowanceService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly snackBar   = inject(MatSnackBar);

  readonly empId = input<number | null>(null);

  readonly rows    = signal<AllowanceRow[]>([]);
  readonly loading = signal(false);
  readonly saving  = signal(false);

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
            faId:     a.faId,
            faCode:   a.faCode,
            faName:   a.faName,
            selected: a.isAssigned,
            amount:   a.amount ?? 0,
          })));
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  toggleSelected(faId: number, selected: boolean): void {
    // Reflect the checkbox state immediately.
    this.rows.update(list =>
      list.map(r => r.faId === faId ? { ...r, selected } : r)
    );

    if (!selected) {
      // Unchecked: zero out the amount right away, no formula evaluation needed.
      this.rows.update(list =>
        list.map(r => r.faId === faId ? { ...r, amount: 0 } : r)
      );
      return;
    }

    // Checked: ask the server to evaluate the allowance's formula (or its static
    // fallback) for this employee, and populate the row's amount with the result.
    const empId = this.empId();
    if (empId == null) return;

    this.empFaSvc.previewAmount(empId, faId, this.payrollMonth)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: preview => {
          this.rows.update(list =>
            list.map(r => r.faId === faId ? { ...r, amount: preview.result ?? 0 } : r)
          );
          if (preview.userFriendlyError) {
            this.snackBar.open(preview.userFriendlyError, 'Close', { duration: 3500 });
          }
        },
        error: () => {
          this.rows.update(list =>
            list.map(r => r.faId === faId ? { ...r, amount: 0 } : r)
          );
          this.snackBar.open('Could not calculate the allowance amount.', 'Close', { duration: 3000 });
        },
      });
  }

  save(): void {
    const empId = this.empId();
    if (empId == null || this.saving()) return;

    const payload: EmployeeFixedAllowanceAssignRequest = {
      payrollMonth: this.payrollMonth,
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
