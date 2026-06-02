import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { IndividualSalaryService } from '../../shared/individual-salary.service';
import { PayrollEmployeeGridComponent } from '../../shared/payroll-employee-grid/payroll-employee-grid.component';
import { GridColumnDef, PayrollEntryRow } from '../../payroll.models';

@Component({
  selector: 'app-salary-increment',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatIconModule, PayrollEmployeeGridComponent,
  ],
  template: `
    <div class="inc-controls">
      <mat-form-field appearance="outline">
        <mat-label>Effective Date</mat-label>
        <input matInput type="date" [formControl]="effectiveDateCtrl" aria-label="Increment effective date"/>
      </mat-form-field>
      <mat-form-field appearance="outline">
        <mat-label>Increment Type</mat-label>
        <mat-select [formControl]="incTypeCtrl" aria-label="Increment type">
          @for (t of incTypes; track t.value) {
            <mat-option [value]="t.value">{{ t.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <div class="bulk-fill">
        <mat-form-field appearance="outline">
          <mat-label>Bulk % for all</mat-label>
          <input matInput type="number" min="0" [formControl]="bulkPctCtrl" aria-label="Bulk increment percentage"/>
        </mat-form-field>
        <button mat-stroked-button (click)="applyBulk()">Apply to all</button>
      </div>
      <div class="inc-io-actions">
        <button mat-stroked-button type="button" (click)="exportCsv()" aria-label="Export salary increment data as CSV">
          <mat-icon>download</mat-icon> Export
        </button>
        <button mat-stroked-button type="button" (click)="importInput.click()" aria-label="Import salary increment data from CSV">
          <mat-icon>upload</mat-icon> Import
        </button>
        <input #importInput type="file" accept=".csv" style="display:none"
               aria-hidden="true" (change)="importCsv($event)">
      </div>
    </div>
    <app-payroll-employee-grid
      [columns]="columns"
      [rows]="svc.entries()"
      [loading]="svc.loading()"
      (rowChanged)="onRowChanged($event)">
    </app-payroll-employee-grid>
  `,
  styles: [`
    .inc-controls { display: flex; gap: 16px; flex-wrap: wrap; padding: 12px 0; align-items: flex-end; }
    .bulk-fill { display: flex; gap: 8px; align-items: flex-end; }
    .inc-io-actions { display: flex; gap: 8px; align-items: center; margin-left: auto; }
  `],
})
export class SalaryIncrementComponent {
  readonly svc = inject(IndividualSalaryService);
  private readonly fb = inject(FormBuilder);

  readonly incTypes = [
    { value: 'Annual',    label: 'Annual'    },
    { value: 'Promotion', label: 'Promotion' },
    { value: 'Merit',     label: 'Merit'     },
    { value: 'Adhoc',     label: 'Ad Hoc'   },
  ];

  readonly effectiveDateCtrl = this.fb.nonNullable.control('');
  readonly incTypeCtrl       = this.fb.nonNullable.control('Annual');
  readonly bulkPctCtrl       = this.fb.nonNullable.control(0);

  readonly columns: GridColumnDef[] = [
    { field: 'empCode',          header: 'Employee',              type: 'display' },
    { field: 'grossPay',         header: 'Current CTC (₹/yr)',    type: 'computed',
      formatter: (_, r) => `₹ ${(r.grossPay * 12).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
    { field: 'basicPay',         header: 'Current Basic (₹/mo)', type: 'display' },
    { field: 'incrementPct',     header: 'Increment %',           type: 'number', editable: true,
      validator: v => (v as number) >= 0 ? null : 'Must be ≥ 0' },
    {
      field: 'incrementAmount', header: 'Increment Amount (₹/mo)', type: 'computed',
      formatter: (_, row: PayrollEntryRow) => {
        const r = row as unknown as { incrementPct: number };
        return `₹ ${((r.incrementPct / 100) * row.basicPay).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      },
    },
    {
      field: 'newBasic', header: 'New Basic (₹/mo)', type: 'computed',
      formatter: (_, row: PayrollEntryRow) => {
        const r = row as unknown as { incrementPct: number };
        return `₹ ${(row.basicPay + (r.incrementPct / 100) * row.basicPay).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
      },
    },
    {
      field: 'newCtc', header: 'New CTC (₹/yr)', type: 'computed',
      formatter: (_, row: PayrollEntryRow) => {
        const r = row as unknown as { incrementPct: number };
        const nb = row.basicPay + (r.incrementPct / 100) * row.basicPay;
        return `₹ ${(nb * 12).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
      },
    },
    { field: 'effectiveDate', header: 'Effective Date', type: 'date',  editable: true },
    { field: 'incStatus',     header: 'Status',         type: 'badge' },
  ];

  applyBulk(): void {
    const pct = this.bulkPctCtrl.value;
    if (pct > 30) {
      if (!confirm(`Increment of ${pct}% is above 30%. Confirm?`)) return;
    }
    this.svc.entries().forEach(r => this.svc.updateRow(r.id, 'incrementPct', pct));
  }

  onRowChanged(evt: { row: PayrollEntryRow; field: string; value: unknown }): void {
    if (evt.field === 'incrementPct' && (evt.value as number) > 30) {
      if (!confirm(`Increment of ${evt.value}% is above 30%. Confirm?`)) return;
    }
    this.svc.updateRow(evt.row.id, evt.field, evt.value);
  }

  exportCsv(): void {
    const header = 'Employee,Increment %,Effective Date';
    const rows = this.svc.entries().map(r => {
      const pct = (r as unknown as { incrementPct: number }).incrementPct ?? 0;
      const date = (r as unknown as { effectiveDate: string }).effectiveDate ?? '';
      return `${r.empCode},${pct},${date}`;
    });
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'salary-increment.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  importCsv(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const lines = (reader.result as string).split('\n').slice(1);
      for (const line of lines) {
        const [empCode, pctStr, date] = line.split(',');
        const row = this.svc.entries().find(r => r.empCode === empCode?.trim());
        if (!row) continue;
        const pct = Number(pctStr);
        if (!isNaN(pct)) this.svc.updateRow(row.id, 'incrementPct', pct);
        if (date?.trim()) this.svc.updateRow(row.id, 'effectiveDate', date.trim());
      }
    };
    reader.readAsText(file);
    (event.target as HTMLInputElement).value = '';
  }
}
