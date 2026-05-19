import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MasterDataTableComponent } from '../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../../shared/components/master-data-table/master-data-table.config';
import { GroupDialog } from './group-dialog';
import { GroupModel } from './group.model';

const MOCK_GROUPS: GroupModel[] = [
  new GroupModel(1, 'GRP01', 'Finance',           true),
  new GroupModel(2, 'GRP02', 'Human Resources',   true),
  new GroupModel(3, 'GRP03', 'Operations',         true),
  new GroupModel(4, 'GRP04', 'Administration',     true),
  new GroupModel(5, 'GRP05', 'Management',         true),
  new GroupModel(6, 'GRP06', 'IT',                 true),
  new GroupModel(7, 'GRP07', 'Sales',              false),
];

@Component({
  selector: 'app-groups',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MasterDataTableComponent],
  templateUrl: './groups.html',
  styleUrl: './groups.scss',
})
export class Groups {
  private readonly dialog = inject(MatDialog);

  readonly groups = signal<GroupModel[]>(MOCK_GROUPS);

  readonly tableConfig: MasterDataTableConfig<GroupModel> = {
    title: 'Groups',
    showNewButton: true,
    columns: [
      { key: 'id',       label: 'ID',     sortable: false },
      { key: 'code',     label: 'Code' },
      { key: 'name',     label: 'Name' },
      { key: 'isActive', label: 'Active', type: 'boolean' },
    ],
  };

  onRowSelected(row: GroupModel): void {
    this.openDialog(row);
  }

  onNewClicked(): void {
    this.openDialog(null);
  }

  private openDialog(row: GroupModel | null): void {
    this.dialog.open(GroupDialog, {
      panelClass: 'square-dialog',
      width: '600px',
      data: row,
    });
  }
}
