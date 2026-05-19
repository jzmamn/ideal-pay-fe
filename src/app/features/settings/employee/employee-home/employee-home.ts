import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MasterDataTableComponent } from '../../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../../../shared/components/master-data-table/master-data-table.config';
import { EmployeeModel } from '../employee.model';
import { EmployeeService } from '../employee.service';

@Component({
  selector: 'app-employee-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MasterDataTableComponent],
  templateUrl: './employee-home.html',
  styleUrl: './employee-home.scss',
})
export class EmployeeHome {
  private readonly router = inject(Router);
  private readonly service = inject(EmployeeService);

  readonly employees = this.service.employees;

  readonly tableConfig: MasterDataTableConfig<EmployeeModel> = {
    title: 'Employees',
    showNewButton: true,
    showActiveFilter: true,
    columns: [
      { key: 'employeeNo',    label: 'Emp No',     sortable: true },
      { key: 'firstName',     label: 'First Name', sortable: true },
      { key: 'lastName',      label: 'Last Name',  sortable: true },
      { key: 'employeeTypeId', label: 'Type',      sortable: true },
      { key: 'isActive',      label: 'Status',     type: 'boolean', sortable: false },
    ],
  };

  onRowSelected(emp: EmployeeModel): void {
    this.service.select(emp);
    this.router.navigate(['/employee/info']);
  }

  onNewClicked(): void {
    this.service.clearSelection();
    this.router.navigate(['/employee/add']);
  }
}
