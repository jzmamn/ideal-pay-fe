import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MasterDataTableComponent } from '../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../../shared/components/master-data-table/master-data-table.config';
import { MasterDataDialog, MasterDataDialogData } from '../../../shared/components/master-data-dialog/master-data-dialog';
import { MasterDataService } from '../../../shared/services/master-data.service';
import { Country, MasterEntity } from '../../../shared/models/master-data.models';

@Component({
  selector: 'app-countries',
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
export class Countries {
  private readonly dialog = inject(MatDialog);
  private readonly masterSvc = inject(MasterDataService);

  readonly data = this.masterSvc.countries;

  readonly config: MasterDataTableConfig<Country> = {
    title: 'Countries',
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
    this.masterSvc.reload('countries');
  }

  openDialog(item?: MasterEntity): void {
    this.dialog.open(MasterDataDialog, {
      panelClass: 'square-dialog',
      width: '600px',
      data: { entity: 'countries', title: 'Country', icon: 'public', item } satisfies MasterDataDialogData,
    });
  }
}
