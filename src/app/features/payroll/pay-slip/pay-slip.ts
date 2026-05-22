import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { type EmployeeModel } from '../../settings/employee/employee.model';
import { TableAutocomplete, type TableColumn } from '../../../shared/components/table-autocomplete/table-autocomplete';

@Component({
  selector: 'app-pay-slip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatDividerModule,
    TableAutocomplete,
  ],
  templateUrl: './pay-slip.html',
  styleUrl: './pay-slip.scss',
})
export class PaySlip {
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

  onItemSelected(item: unknown): void {
    this.selectedEmployee.set(item as EmployeeModel);
  }

  printSlip(): void {
    window.print();
  }
}
