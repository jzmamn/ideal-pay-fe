import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MasterDataTableComponent } from '../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../../shared/components/master-data-table/master-data-table.config';
import { RoleDialog } from './role-dialog';
import { RoleModel } from './role.model';

const MOCK_ROLES: RoleModel[] = [
  { id: 1, code: 'ADMIN',    name: 'Administrator',  description: 'Full system access',              isActive: true  },
  { id: 2, code: 'MGR',      name: 'Manager',         description: 'Department management access',    isActive: true  },
  { id: 3, code: 'ACCT',     name: 'Accountant',      description: 'Financial records access',        isActive: true  },
  { id: 4, code: 'HR',       name: 'HR Officer',      description: 'Employee data access',            isActive: true  },
  { id: 5, code: 'PAYROLL',  name: 'Payroll Clerk',   description: 'Payroll processing access',       isActive: true  },
  { id: 6, code: 'VIEWER',   name: 'Viewer',          description: 'Read-only access',                isActive: false },
];

@Component({
  selector: 'app-roles',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MasterDataTableComponent],
  template: `
    <app-master-data-table
      [config]="tableConfig"
      [data]="roles()"
      (rowSelected)="onRowSelected($event)"
      (newClicked)="onNewClicked()">
    </app-master-data-table>
  `,
})
export class Roles {
  private readonly dialog = inject(MatDialog);

  readonly roles = signal<RoleModel[]>(MOCK_ROLES);

  readonly tableConfig: MasterDataTableConfig<RoleModel> = {
    title: 'Roles',
    showNewButton: true,
    columns: [
      { key: 'id',          label: 'ID',          sortable: false },
      { key: 'code',        label: 'Code' },
      { key: 'name',        label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'isActive',    label: 'Active', type: 'boolean' },
    ],
  };

  onRowSelected(row: RoleModel): void {
    this.openDialog(row);
  }

  onNewClicked(): void {
    this.openDialog(null);
  }

  private openDialog(row: RoleModel | null): void {
    this.dialog.open(RoleDialog, {
      panelClass: 'square-dialog',
      width: '480px',
      maxWidth: '480px',
      data: row,
    });
  }
}
