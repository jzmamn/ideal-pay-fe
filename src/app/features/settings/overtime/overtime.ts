import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MasterDataTableComponent } from '../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../../shared/components/master-data-table/master-data-table.config';
import { OvertimeDialog } from './overtime-dialog';
import { OvertimeModel } from './overtime.model';
import { OvertimeService } from './overtime.service';

@Component({
  selector: 'app-overtime',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MasterDataTableComponent],
  templateUrl: './overtime.html',
  styleUrl: './overtime.scss',
})
export class Overtime implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly overtimeService = inject(OvertimeService);

  readonly overtimes = signal<OvertimeModel[]>([]);

  readonly tableConfig: MasterDataTableConfig<OvertimeModel> = {
    title: 'Over Time',
    showNewButton: true,
    showActiveFilter: true,
    columns: [
      { key: 'id',             label: 'ID',      sortable: false },
      { key: 'code',           label: 'Code' },
      { key: 'name',           label: 'Name' },
      { key: 'isActive',       label: 'Active',  type: 'boolean' },
      { key: 'formulaEnabled', label: 'Formula', type: 'icon', icon: 'functions', iconTooltip: 'Formula enabled', sortable: false },
    ],
  };

  ngOnInit(): void {
    this.load();
  }

  onRowSelected(row: OvertimeModel): void {
    this.openDialog(row);
  }

  onNewClicked(): void {
    this.openDialog(null);
  }

  private load(): void {
    this.overtimeService.getAll().subscribe(data => this.overtimes.set(data));
  }

  private openDialog(row: OvertimeModel | null): void {
    this.dialog.open(OvertimeDialog, {
      panelClass: 'square-dialog',
      width: '600px',
      data: row,
    }).afterClosed().subscribe(saved => { if (saved) this.load(); });
  }
}
