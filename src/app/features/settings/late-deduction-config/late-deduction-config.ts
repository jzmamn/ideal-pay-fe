import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MasterDataTableComponent } from '../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../../shared/components/master-data-table/master-data-table.config';
import { LateDeductionConfigDialog } from './late-deduction-config-dialog';
import { LateDeductionConfigModel } from './late-deduction-config.model';
import { LateDeductionConfigService } from './late-deduction-config.service';

@Component({
  selector: 'app-late-deduction-config',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MasterDataTableComponent],
  templateUrl: './late-deduction-config.html',
  styleUrl:    './late-deduction-config.scss',
})
export class LateDeductionConfig implements OnInit {
  private readonly dialog    = inject(MatDialog);
  private readonly configSvc = inject(LateDeductionConfigService);

  readonly configs = signal<LateDeductionConfigModel[]>([]);

  readonly tableConfig: MasterDataTableConfig<LateDeductionConfigModel> = {
    title:            'Late Deduction Configuration',
    showNewButton:    false,   // single-record table — create is locked
    showActiveFilter: false,
    columns: [
      { key: 'id',                 label: 'ID',               sortable: false },
      { key: 'code',               label: 'Code' },
      { key: 'name',               label: 'Name' },
      { key: 'workingDays',        label: 'Working Days',     type: 'number'  },
      { key: 'workingHoursPerDay', label: 'Hrs / Day',        type: 'number'  },
      { key: 'isActive',           label: 'Active',           type: 'boolean' },
      { key: 'formulaEnabled',     label: 'Formula',          type: 'icon', icon: 'functions', iconTooltip: 'Formula enabled', sortable: false },
    ],
  };

  ngOnInit(): void {
    this.load();
  }

  onRowSelected(row: LateDeductionConfigModel): void {
    this.openDialog(row);
  }

  onNewClicked(): void {
    this.openDialog(null);
  }

  private load(): void {
    this.configSvc.getAll().subscribe(data => this.configs.set(data));
  }

  private openDialog(row: LateDeductionConfigModel | null): void {
    this.dialog.open(LateDeductionConfigDialog, {
      panelClass: 'square-dialog',
      width:      '640px',
      data:       row,
    }).afterClosed().subscribe(saved => { if (saved) this.load(); });
  }
}
