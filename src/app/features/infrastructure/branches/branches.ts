import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MasterDataTableComponent } from '../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../../shared/components/master-data-table/master-data-table.config';
import { MasterDataDialog, MasterDataDialogData, FieldDef } from '../../../shared/components/master-data-dialog/master-data-dialog';
import { MasterDataService } from '../../../shared/services/master-data.service';
import { Branch, MasterEntity } from '../../../shared/models/master-data.models';

const EXTRA_FIELDS: FieldDef[] = [
  { key: 'location', label: 'Location', type: 'text' },
];

@Component({
  selector: 'app-branches',
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
export class Branches {
  private readonly dialog = inject(MatDialog);
  private readonly masterSvc = inject(MasterDataService);

  readonly data = this.masterSvc.branches;

  readonly config: MasterDataTableConfig<Branch> = {
    title: 'Branches',
    showNewButton: true,
    showActiveFilter: true,
    columns: [
      { key: 'id',       label: 'ID',       sortable: false },
      { key: 'code',     label: 'Code',     sortable: true  },
      { key: 'name',     label: 'Name',     sortable: true  },
      { key: 'location', label: 'Location'                  },
      { key: 'isActive', label: 'Active',   type: 'boolean' },
    ],
  };

  constructor() {
    this.masterSvc.reload('branches');
  }

  openDialog(item?: MasterEntity): void {
    this.dialog.open(MasterDataDialog, {
      panelClass: 'square-dialog',
      width: '600px',
      data: { entity: 'branches', title: 'Branch', icon: 'store', item, extraFields: EXTRA_FIELDS } satisfies MasterDataDialogData,
    });
  }
}
