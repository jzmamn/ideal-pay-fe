import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MasterDataTableComponent } from '../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../../shared/components/master-data-table/master-data-table.config';
import { MasterDataDialog, MasterDataDialogData } from '../../../shared/components/master-data-dialog/master-data-dialog';
import { MasterDataService } from '../../../shared/services/master-data.service';
import { Designation, MasterEntity } from '../../../shared/models/master-data.models';

@Component({
  selector: 'app-designations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MasterDataTableComponent],
  template: `
    <app-master-data-table
      [config]="config"
      [data]="data()"
      (rowSelected)="openDialog($event)"
      (newClicked)="openDialog()"
    />
  `,
})
export class Designations {
  private readonly dialog = inject(MatDialog);
  private readonly masterSvc = inject(MasterDataService);

  readonly data = this.masterSvc.designations;

  readonly config: MasterDataTableConfig<Designation> = {
    title: 'Designations',
    showNewButton: true,
    showActiveFilter: true,
    columns: [
      { key: 'id',       label: 'ID',     sortable: false },
      { key: 'code',     label: 'Code',   sortable: true  },
      { key: 'name',     label: 'Name',   sortable: true  },
      { key: 'isActive', label: 'Active', type: 'boolean' },
    ],
  };

  constructor() {
    this.masterSvc.reload('designations');
  }

  openDialog(item?: MasterEntity): void {
    this.dialog.open(MasterDataDialog, {
      panelClass: 'square-dialog',
      width: '600px',
      data: { entity: 'designations', title: 'Designation', icon: 'badge', item } satisfies MasterDataDialogData,
    });
  }
}
