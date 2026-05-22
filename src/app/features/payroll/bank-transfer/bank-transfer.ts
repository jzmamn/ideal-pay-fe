import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { type EmployeeModel } from '../../settings/employee/employee.model';
import { TableAutocomplete, type TableColumn } from '../../../shared/components/table-autocomplete/table-autocomplete';

interface TransferRow {
  employeeNo: string;
  name: string;
  bank: string;
  accountNo: string;
  netPay: number;
  status: 'pending' | 'processed' | 'failed';
}

@Component({
  selector: 'app-bank-transfer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatDividerModule,
    MatTableModule,
    MatChipsModule,
    TableAutocomplete,
  ],
  templateUrl: './bank-transfer.html',
  styleUrl: './bank-transfer.scss',
})
export class BankTransfer {
  private readonly fb = inject(FormBuilder);

  readonly employeeCols: TableColumn<EmployeeModel>[] = [
    { key: 'employeeNo', label: 'Emp #' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
  ];

  readonly empDisplayFn = (item: EmployeeModel): string =>
    `${item.firstName} ${item.lastName} — ${item.employeeNo}`;

  readonly form = this.fb.group({
    employeeId: this.fb.control<number | null>(null),
  });

  readonly selectedEmployee = signal<EmployeeModel | null>(null);

  readonly transfers = signal<TransferRow[]>([]);

  readonly displayedColumns = ['employeeNo', 'name', 'bank', 'accountNo', 'netPay', 'status', 'actions'];

  onItemSelected(item: unknown): void {
    this.selectedEmployee.set(item as EmployeeModel);
  }

  addToTransfer(): void {
    const emp = this.selectedEmployee();
    if (!emp) return;

    const alreadyAdded = this.transfers().some(t => t.employeeNo === emp.employeeNo);
    if (alreadyAdded) return;

    this.transfers.update(rows => [
      ...rows,
      {
        employeeNo: emp.employeeNo,
        name: `${emp.firstName} ${emp.lastName}`,
        bank: '',
        accountNo: '',
        netPay: 0,
        status: 'pending',
      },
    ]);
  }

  removeTransfer(employeeNo: string): void {
    this.transfers.update(rows => rows.filter(r => r.employeeNo !== employeeNo));
  }

  processAll(): void {
    this.transfers.update(rows =>
      rows.map(r => ({ ...r, status: r.status === 'pending' ? 'processed' : r.status })),
    );
  }

  readonly totalAmount = signal(0);
}
