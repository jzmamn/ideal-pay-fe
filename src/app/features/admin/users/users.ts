import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MasterDataTableComponent } from '../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../../shared/components/master-data-table/master-data-table.config';
import { UserDialog } from './user-dialog';
import { UserModel } from './user.model';
import { UserService } from './user.service';

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
  private readonly dialog  = inject(MatDialog);
  private readonly userSvc = inject(UserService);

  readonly users = this.userSvc.users;

  readonly tableConfig: MasterDataTableConfig<UserModel> = {
    title: 'Users',
    showNewButton: true,
    showActiveFilter: true,
    columns: [
      { key: 'id',       label: 'ID',        sortable: false },
      { key: 'username', label: 'Username' },
      { key: 'fullName', label: 'Full Name' },
      { key: 'email',    label: 'Email' },
      { key: 'role',     label: 'Role' },
      { key: 'isActive', label: 'Active', type: 'boolean' },
    ],
  };

  constructor() {
    this.userSvc.reload();
  }

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
    }).afterClosed().subscribe(saved => {
      if (saved) this.userSvc.reload();
    });
  }
}
