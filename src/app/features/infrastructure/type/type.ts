import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MasterDataTableComponent } from '../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../../shared/components/master-data-table/master-data-table.config';
import { MasterDataDialog, MasterDataDialogData, FieldDef } from '../../../shared/components/master-data-dialog/master-data-dialog';
import { MasterDataService } from '../../../shared/services/master-data.service';
import { EmployeeType as EmployeeTypeModel, MasterEntity } from '../../../shared/models/master-data.models';

const EXTRA_FIELDS: FieldDef[] = [
  { key: 'description', label: 'Description', type: 'textarea', optional: true },
  { key: 'dateRange',   label: 'Has Contract Period', type: 'toggle', optional: true },
];

@Component({
  selector: 'app-employee-type',
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
export class EmployeeType {
  private readonly dialog = inject(MatDialog);
  private readonly masterSvc = inject(MasterDataService);

  readonly data = this.masterSvc.employeeTypes;

  readonly config: MasterDataTableConfig<EmployeeTypeModel> = {
    title: 'Employee Types',
    showNewButton: true,
    showActiveFilter: true,
    columns: [
      { key: 'id',          label: 'ID',          sortable: false },
      { key: 'code',        label: 'Code',         sortable: true  },
      { key: 'name',        label: 'Name',         sortable: true  },
      { key: 'description', label: 'Description'                   },
      { key: 'isActive',    label: 'Active',       type: 'boolean' },
    ],
  };

  constructor() {
    this.masterSvc.reload('employee-types');
  }

  openDialog(item?: MasterEntity): void {
    this.dialog.open(MasterDataDialog, {
      panelClass: 'square-dialog',
      width: '600px',
      data: { entity: 'employee-types', title: 'Employee Type', icon: 'badge', item, extraFields: EXTRA_FIELDS } satisfies MasterDataDialogData,
    });
  }
}
