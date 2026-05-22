import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { PayrollPrepareService } from '../../shared/payroll-prepare.service';
import { PayrollEmployeeGridComponent } from '../../shared/payroll-employee-grid/payroll-employee-grid.component';
import { GridColumnDef, PayrollEntryRow } from '../../payroll.models';

const MS_PER_YEAR = 1000 * 60 * 60 * 24 * 365.25;

function yearsOfService(joinedDate: string): number {
  return Math.floor((Date.now() - new Date(joinedDate).getTime()) / MS_PER_YEAR);
}

@Component({
  selector: 'app-gratuity',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatButtonToggleModule, PayrollEmployeeGridComponent],
  template: `
    <div class="gratuity-header">
      <p class="formula">Formula: <code>(Basic × Years of Service × 15) / 26</code></p>
      <mat-button-toggle-group [formControl]="modeCtrl" aria-label="Gratuity mode">
        <mat-button-toggle value="include">Include in this payroll run</mat-button-toggle>
        <mat-button-toggle value="separate">Schedule separately</mat-button-toggle>
      </mat-button-toggle-group>
    </div>
    <app-payroll-employee-grid
      [columns]="columns"
      [rows]="eligibleRows()"
      [loading]="svc.loading()"
      (rowChanged)="svc.updateRow($event.row.id, $event.field, $event.value)">
    </app-payroll-employee-grid>
  `,
  styles: [`
    .gratuity-header { padding: 12px 0; display: flex; flex-direction: column; gap: 10px; }
    .formula { margin: 0; font-size: 13px; color: #475569; }
    code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; }
  `],
})
export class GratuityComponent {
  readonly svc = inject(PayrollPrepareService);
  private readonly fb = inject(FormBuilder);

  readonly modeCtrl = this.fb.nonNullable.control('include');

  readonly paymentOptions = signal([
    { value: 'BANK',   label: 'Bank Transfer' },
    { value: 'CHEQUE', label: 'Cheque'        },
  ]);

  readonly eligibleRows = computed(() =>
    this.svc.entries().filter(r => {
      const row = r as unknown as { joinedDate: string };
      return row.joinedDate && yearsOfService(row.joinedDate) >= 5;
    }),
  );

  readonly columns: GridColumnDef[] = [
    { field: 'empCode',     header: 'Employee',          type: 'display' },
    { field: 'joinedDate',  header: 'Date of Joining',   type: 'display' },
    {
      field: 'yearsOfService', header: 'Years of Service', type: 'computed',
      formatter: (_, row: PayrollEntryRow) => {
        const r = row as unknown as { joinedDate: string };
        return `${yearsOfService(r.joinedDate ?? '')} yrs`;
      },
    },
    { field: 'basicPay', header: 'Last Basic (₹/mo)', type: 'display' },
    {
      field: 'gratuityAmount', header: 'Gratuity (₹)', type: 'computed',
      formatter: (_, row: PayrollEntryRow) => {
        const r = row as unknown as { joinedDate: string };
        const yrs = yearsOfService(r.joinedDate ?? '');
        const amt = (row.basicPay * yrs * 15) / 26;
        return `₹ ${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      },
    },
    { field: 'includeInRun',  header: 'Include in Run', type: 'toggle',   editable: true },
    { field: 'paymentMode',   header: 'Payment Mode',   type: 'dropdown', editable: true, options: this.paymentOptions },
    { field: 'remarks',       header: 'Remarks',        type: 'number',   editable: true },
  ];
}
