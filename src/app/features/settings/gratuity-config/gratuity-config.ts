import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MasterDataTableComponent } from '../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig }    from '../../../shared/components/master-data-table/master-data-table.config';
import { GratuityConfigDialog }     from './gratuity-config-dialog';
import { GratuityConfigModel }      from './gratuity-config.model';
import { GratuityConfigService }    from './gratuity-config.service';

@Component({
  selector: 'app-gratuity-config',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MasterDataTableComponent],
  template: `
    <app-master-data-table
      [config]="tableConfig()"
      [data]="configs()"
      (rowSelected)="onRowSelected($event)"
      (newClicked)="onNewClicked()">
    </app-master-data-table>
  `,
})
export class GratuityConfigComponent implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly svc    = inject(GratuityConfigService);

  readonly configs = signal<GratuityConfigModel[]>([]);

  readonly tableConfig = computed<MasterDataTableConfig<GratuityConfigModel>>(() => ({
    title:            'Gratuity Configuration',
    showNewButton:    this.configs().length === 0,
    showActiveFilter: false,
    columns: [
      { key: 'id',             label: 'ID',      sortable: false },
      { key: 'code',           label: 'Code' },
      { key: 'name',           label: 'Name' },
      { key: 'isActive',       label: 'Active',  type: 'boolean' },
      { key: 'formulaEnabled', label: 'Formula', type: 'icon', icon: 'functions',
        iconTooltip: 'Custom formula enabled', sortable: false },
    ],
  }));

  ngOnInit(): void { this.load(); }

  onRowSelected(row: GratuityConfigModel): void { this.openDialog(row); }
  onNewClicked():                          void { this.openDialog(null); }

  private load(): void {
    this.svc.getAll().subscribe(data => this.configs.set(data));
  }

  private openDialog(row: GratuityConfigModel | null): void {
    this.dialog.open(GratuityConfigDialog, {
      panelClass: 'square-dialog',
      width:      '640px',
      data:       row,
    }).afterClosed().subscribe(saved => { if (saved) this.load(); });
  }
}
