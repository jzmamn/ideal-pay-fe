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
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EmployeeProfileService } from '../employee-profile.service';
import { EmployeeFixedDeductionResponse } from './employee-fixed-deduction.model';

/**
 * Displays fixed deductions loaded for an employee in the payroll period.
 *
 * Per spec, all loaded deduction amounts are **read-only** regardless of whether
 * the deduction uses a formula or a fixed amount. To change an amount, update the
 * deduction master definition and re-run the payroll component load.
 */
@Component({
  selector: 'app-employee-deductions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './employee-fixed-deduction.component.html',
  styleUrl: './employee-fixed-deduction.component.scss',
})
export class EmployeeDeductions {
  private readonly profileSvc = inject(EmployeeProfileService);
  private readonly destroyRef = inject(DestroyRef);

  readonly empId = input<number | null>(null);

  readonly deductions = signal<EmployeeFixedDeductionResponse[]>([]);

  readonly totalFixedDeduction = computed(() =>
    this.deductions().reduce((sum, d) => sum + d.amount, 0)
  );

  constructor() {
    effect(() => {
      const id = this.empId();
      if (id != null) {
        this.profileSvc.getEmployeeProfileByEmployee(id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(profile => this.deductions.set(profile.fixedDeductions));
      } else {
        this.deductions.set([]);
      }
    });
  }
}
