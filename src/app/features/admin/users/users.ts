import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MasterDataTableComponent } from '../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../../shared/components/master-data-table/master-data-table.config';
import { UserDialog } from './user-dialog';
import { UserModel } from './user.model';

const MOCK_USERS: UserModel[] = [
  { id: 1, code: 'USR001', username: 'admin',   fullName: 'Admin User',    email: 'admin@idealpay.com',   role: 'Administrator', isActive: true  },
  { id: 2, code: 'USR002', username: 'jsmith',  fullName: 'John Smith',    email: 'jsmith@idealpay.com',  role: 'Manager',       isActive: true  },
  { id: 3, code: 'USR003', username: 'mjones',  fullName: 'Mary Jones',    email: 'mjones@idealpay.com',  role: 'Accountant',    isActive: true  },
  { id: 4, code: 'USR004', username: 'rwilson', fullName: 'Robert Wilson', email: 'rwilson@idealpay.com', role: 'HR Officer',    isActive: false },
  { id: 5, code: 'USR005', username: 'lbrown',  fullName: 'Lisa Brown',    email: 'lbrown@idealpay.com',  role: 'Payroll Clerk', isActive: true  },
];

@Component({
  selector: 'app-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MasterDataTableComponent],
  template: `
    <app-master-data-table
      [config]="tableConfig"
      [data]="users()"
      (rowSelected)="onRowSelected($event)"
      (newClicked)="onNewClicked()">
    </app-master-data-table>
  `,
})
export class Users {
  private readonly dialog = inject(MatDialog);

  readonly users = signal<UserModel[]>(MOCK_USERS);

  readonly tableConfig: MasterDataTableConfig<UserModel> = {
    title: 'Users',
    showNewButton: true,
    columns: [
      { key: 'id',       label: 'ID',        sortable: false },
      { key: 'username', label: 'Username' },
      { key: 'fullName', label: 'Full Name' },
      { key: 'email',    label: 'Email' },
      { key: 'role',     label: 'Role' },
      { key: 'isActive', label: 'Active', type: 'boolean' },
    ],
  };

  onRowSelected(row: UserModel): void {
    this.openDialog(row);
  }

  onNewClicked(): void {
    this.openDialog(null);
  }

  private openDialog(row: UserModel | null): void {
    this.dialog.open(UserDialog, {
      panelClass: 'square-dialog',
      width: '480px',
      maxWidth: '480px',
      data: row,
    });
  }
}
