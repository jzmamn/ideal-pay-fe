import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { PayrollPrepareService } from '../../shared/payroll-prepare.service';
import { PayrollEmployeeGridComponent } from '../../shared/payroll-employee-grid/payroll-employee-grid.component';
import { GridColumnDef } from '../../payroll.models';

@Component({
  selector: 'app-tax',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, PayrollEmployeeGridComponent],
  template: `
    <div class="tax-controls">
      <span class="tax-year">Tax Year: FY 2026–27</span>
      <button mat-stroked-button (click)="svc.recalculateTax()" aria-label="Recalculate all TDS">
        Recalculate All TDS
      </button>
    </div>
    <app-payroll-employee-grid
      [columns]="columns"
      [rows]="svc.entries()"
      [loading]="svc.loading()"
      (rowChanged)="svc.updateRow($event.row.id, $event.field, $event.value)">
    </app-payroll-employee-grid>
  `,
  styles: [`
    .tax-controls { display: flex; align-items: center; gap: 16px; padding: 12px 0; }
    .tax-year { font-size: 13px; color: #64748b; }
  `],
})
export class TaxComponent {
  readonly svc = inject(PayrollPrepareService);

  private readonly regimeOptions = signal([
    { value: 'OLD', label: 'Old Regime' },
    { value: 'NEW', label: 'New Regime' },
  ]);

  readonly columns: GridColumnDef[] = [
    { field: 'empCode',               header: 'Employee',                type: 'display' },
    { field: 'taxRegime',             header: 'Regime',                  type: 'badge'   },
    { field: 'projectedAnnualIncome', header: 'Projected Annual (₹)',    type: 'display' },
    { field: 'taxableIncome',         header: 'Taxable Income (₹)',      type: 'display' },
    { field: 'annualTax',             header: 'Annual Tax (₹)',          type: 'display' },
    { field: 'taxDeductedYtd',        header: 'TDS YTD (₹)',             type: 'display' },
    {
      field: 'tdsThisMonth', header: 'TDS This Month (₹)', type: 'number', editable: true,
      validator: v => (v as number) >= 0 ? null : 'Must be ≥ 0',
    },
    { field: 'surchargeAndCess', header: 'Surcharge / Cess (₹)', type: 'display' },
  ];
}
