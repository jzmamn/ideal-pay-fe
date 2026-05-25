import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MasterDataTableComponent } from '../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../../shared/components/master-data-table/master-data-table.config';
import { MasterDataService } from '../../../shared/services/master-data.service';
import { NoPayDays } from '../../../shared/models/master-data.models';
import { NopayDialog } from './nopay-dialog';

@Component({
  selector: 'app-nopay-days',
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
export class NopayDays {
  private readonly dialog    = inject(MatDialog);
  private readonly masterSvc = inject(MasterDataService);

  readonly data = this.masterSvc.nopayDays;

  readonly config: MasterDataTableConfig<NoPayDays> = {
    title: 'Nopay Days',
    showNewButton: true,
    showActiveFilter: true,
    columns: [
      { key: 'id',       label: 'ID',         sortable: false },
      { key: 'code',     label: 'Code',        sortable: true  },
      { key: 'name',     label: 'Name',        sortable: true  },
      { key: 'days',     label: 'No Pay Days', type: 'number'  },
      { key: 'isActive', label: 'Active',      type: 'boolean' },
    ],
  };

  constructor() {
    this.masterSvc.reload('nopay-days');
  }

  openDialog(item?: NoPayDays): void {
    this.dialog.open(NopayDialog, {
      panelClass: 'square-dialog',
      width: '700px',
      data: item ?? null,
    });
  }
}
