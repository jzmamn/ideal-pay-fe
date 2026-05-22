import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { PayrollPrepareService } from '../../shared/payroll-prepare.service';
import { PayrollEmployeeGridComponent } from '../../shared/payroll-employee-grid/payroll-employee-grid.component';
import { GridColumnDef, PayrollEntryRow } from '../../payroll.models';

const MIN_WAGE = 15_000;

@Component({
  selector: 'app-salary-decrement',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, PayrollEmployeeGridComponent,
  ],
  template: `
    <div class="dec-controls">
      <mat-form-field appearance="outline">
        <mat-label>Effective Date</mat-label>
        <input matInput type="date" [formControl]="effectiveDateCtrl" aria-label="Decrement effective date"/>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Decrement Type</mat-label>
        <mat-select [formControl]="decTypeCtrl" aria-label="Decrement type">
          @for (t of decTypes; track t.value) {
            <mat-option [value]="t.value">{{ t.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
    </div>
    <app-payroll-employee-grid
      [columns]="columns"
      [rows]="svc.entries()"
      [loading]="svc.loading()"
      (rowChanged)="svc.updateRow($event.row.id, $event.field, $event.value)">
    </app-payroll-employee-grid>
  `,
  styles: [`.dec-controls { display: flex; gap: 16px; padding: 12px 0; flex-wrap: wrap; }`],
})
export class SalaryDecrementComponent {
  readonly svc = inject(PayrollPrepareService);
  private readonly fb = inject(FormBuilder);

  readonly decTypes = [
    { value: 'Demotion',    label: 'Demotion'     },
    { value: 'Disciplinary',label: 'Disciplinary' },
    { value: 'RoleChange',  label: 'Role Change'  },
    { value: 'Adhoc',       label: 'Ad Hoc'       },
  ];

  private readonly reasonOptions = signal([
    { value: 'Demotion',    label: 'Demotion'     },
    { value: 'Disciplinary',label: 'Disciplinary' },
    { value: 'Performance', label: 'Performance'  },
    { value: 'RoleChange',  label: 'Role Change'  },
    { value: 'Other',       label: 'Other'        },
  ]);

  readonly effectiveDateCtrl = this.fb.nonNullable.control('');
  readonly decTypeCtrl       = this.fb.nonNullable.control('Demotion');

  readonly columns: GridColumnDef[] = [
    { field: 'empCode',         header: 'Employee',              type: 'display' },
    { field: 'basicPay',        header: 'Current Basic (₹/mo)', type: 'display' },
    {
      field: 'decrementPct', header: 'Decrement %', type: 'number', editable: true,
      validator: (v, row: PayrollEntryRow) => {
        if ((v as number) < 0) return 'Must be ≥ 0';
        const newBasic = row.basicPay - (v as number / 100) * row.basicPay;
        if (newBasic < MIN_WAGE) return `New basic ₹${newBasic.toFixed(0)} is below minimum wage ₹${MIN_WAGE}`;
        return null;
      },
    },
    {
      field: 'decrementAmount', header: 'Decrement Amount (₹/mo)', type: 'computed',
      formatter: (_, row: PayrollEntryRow) => {
        const r = row as unknown as { decrementPct: number };
        return `₹ ${((r.decrementPct / 100) * row.basicPay).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      },
    },
    {
      field: 'newBasic', header: 'New Basic (₹/mo)', type: 'computed',
      formatter: (_, row: PayrollEntryRow) => {
        const r = row as unknown as { decrementPct: number };
        const nb = row.basicPay - (r.decrementPct / 100) * row.basicPay;
        return `₹ ${nb.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      },
    },
    { field: 'decReason',      header: 'Reason',        type: 'dropdown', editable: true, options: this.reasonOptions },
    { field: 'approvedBy',     header: 'Approved By',   type: 'number',   editable: true },
    { field: 'decEffectiveDate',header: 'Effective Date',type: 'date',     editable: true },
    { field: 'decStatus',      header: 'Status',        type: 'badge'    },
  ];
}
