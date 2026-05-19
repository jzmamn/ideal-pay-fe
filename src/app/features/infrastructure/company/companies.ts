import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MasterDataTableComponent } from '../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../../shared/components/master-data-table/master-data-table.config';
import { MasterDataService } from '../../../shared/services/master-data.service';
import { Company } from '../../../shared/models/master-data.models';
import { CompanyDialog } from './company-dialog';

@Component({
  selector: 'app-companies',
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
export class Companies {
  private readonly dialog    = inject(MatDialog);
  private readonly masterSvc = inject(MasterDataService);

  readonly data = this.masterSvc.companies;

  readonly config: MasterDataTableConfig<Company> = {
    title: 'Companies',
    showNewButton: true,
    columns: [
      { key: 'id',            label: 'ID',             sortable: false },
      { key: 'code',          label: 'Code',           sortable: true  },
      { key: 'name',          label: 'Company Name',   sortable: true  },
      { key: 'contactPerson', label: 'Contact Person'                  },
      { key: 'address.city',  label: 'City'                            },
      { key: 'telephone',     label: 'Telephone'                       },
      { key: 'isActive',      label: 'Active',         type: 'boolean' },
    ],
  };

  constructor() {
    this.masterSvc.reload('companies');
  }

  openDialog(item?: Company): void {
    this.dialog.open(CompanyDialog, {
      panelClass: 'square-dialog',
      width: '60vw',
      maxWidth: '60vw',
      data: item ?? null,
    });
  }
}
