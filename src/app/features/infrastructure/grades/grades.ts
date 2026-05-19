import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MasterDataTableComponent } from '../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../../shared/components/master-data-table/master-data-table.config';
import { MasterDataDialog, MasterDataDialogData, FieldDef } from '../../../shared/components/master-data-dialog/master-data-dialog';
import { MasterDataService } from '../../../shared/services/master-data.service';
import { Grade, MasterEntity } from '../../../shared/models/master-data.models';

const EXTRA_FIELDS: FieldDef[] = [
  { key: 'amount', label: 'Amount', type: 'number', optional: true },
  { key: 'description', label: 'Description', type: 'textarea', optional: true },
];

@Component({
  selector: 'app-grades',
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
export class Grades {
  private readonly dialog = inject(MatDialog);
  private readonly masterSvc = inject(MasterDataService);

  readonly data = this.masterSvc.grades;

  readonly config: MasterDataTableConfig<Grade> = {
    title: 'Grades',
    showNewButton: true,
    showActiveFilter: true,
    columns: [
      { key: 'id',          label: 'ID',          sortable: false },
      { key: 'code',        label: 'Code',         sortable: true  },
      { key: 'name',        label: 'Name',         sortable: true  },
      { key: 'amount',      label: 'Amount'                        },
      { key: 'description', label: 'Description'                   },
      { key: 'isActive',    label: 'Active',       type: 'boolean' },
    ],
  };

  constructor() {
    this.masterSvc.reload('grades');
  }

  openDialog(item?: MasterEntity): void {
    this.dialog.open(MasterDataDialog, {
      panelClass: 'square-dialog',
      width: '600px',
      data: { entity: 'grades', title: 'Grade', icon: 'grade', item, extraFields: EXTRA_FIELDS } satisfies MasterDataDialogData,
    });
  }
}
