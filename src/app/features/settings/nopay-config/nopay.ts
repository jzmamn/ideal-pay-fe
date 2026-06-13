import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MasterDataTableComponent } from '../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../../shared/components/master-data-table/master-data-table.config';
import { NopayDialog, NopayDialogResult } from './nopay-dialog';
import { NopayModel } from './nopay.model';
import { NopayService } from './nopay.service';

@Component({
  selector: 'app-nopay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MasterDataTableComponent],
  template: `
    <app-master-data-table
      [config]="tableConfig"
      [data]="nopayList()"
      (rowSelected)="onRowSelected($event)"
      (newClicked)="onNewClicked()"
    />
  `,
})
export class Nopay implements OnInit {
  private readonly dialog      = inject(MatDialog);
  private readonly nopayService = inject(NopayService);

  readonly nopayList = signal<NopayModel[]>([]);

  readonly tableConfig: MasterDataTableConfig<NopayModel> = {
    title: 'Nopay',
    showNewButton: true,
    showActiveFilter: true,
    columns: [
      { key: 'id',             label: 'ID',              sortable: false },
      { key: 'code',           label: 'Code' },
      { key: 'name',           label: 'Name' },
      { key: 'formulaEnabled', label: 'Formula',         type: 'icon', icon: 'functions', iconTooltip: 'Formula enabled', sortable: false },
      { key: 'isActive',       label: 'Active',          type: 'boolean' },
      { key: 'liableForEpf',   label: 'Liable for EPF',  type: 'boolean' },
      { key: 'liableForEtf',   label: 'Liable for ETF',  type: 'boolean' },
      { key: 'liableForPaye',  label: 'Liable for PAYE', type: 'boolean' },
    ],
  };

  ngOnInit(): void {
    this.load();
  }

  onRowSelected(row: NopayModel): void {
    this.openDialog(row);
  }

  onNewClicked(): void {
    this.openDialog(null);
  }

  private load(): void {
    this.nopayService.getAll().subscribe({
      next:  data => this.nopayList.set(data),
      error: err  => console.error('Failed to load nopay types', err),
    });
  }

  private openDialog(row: NopayModel | null): void {
    const dialogRef = this.dialog.open(NopayDialog, {
      panelClass: 'square-dialog',
      width: '600px',
      data: { row },
    });

    dialogRef.afterClosed().subscribe((result: NopayDialogResult | undefined) => {
      if (!result) return;
      this.handleResult(result);
    });
  }

  private handleResult(result: NopayDialogResult): void {
    switch (result.action) {
      case 'create':
        this.nopayService.create(result.data).subscribe(created => {
          this.nopayList.update(list => [...list, created]);
        });
        break;
      case 'update':
        this.nopayService.update(result.data.id, result.data).subscribe(() => {
          this.nopayList.update(list =>
            list.map(n => n.id === result.data.id ? result.data : n),
          );
        });
        break;
      case 'delete':
        this.nopayService.delete(result.id).subscribe(() => {
          this.nopayList.update(list => list.filter(n => n.id !== result.id));
        });
        break;
    }
  }
}
