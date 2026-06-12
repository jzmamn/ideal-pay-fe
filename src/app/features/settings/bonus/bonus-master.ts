import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { MasterDataTableComponent } from '../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../../shared/components/master-data-table/master-data-table.config';
import { BonusDialog, BonusDialogResult } from './bonus-dialog';
import { BonusModel } from './bonus.model';
import { BonusService } from './bonus.service';

@Component({
  selector: 'app-bonus-master',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MasterDataTableComponent],
  templateUrl: './bonus-master.html',
  styleUrl: './bonus-master.scss',
})
export class BonusMaster implements OnInit {
  private readonly dialog      = inject(MatDialog);
  private readonly bonusSvc    = inject(BonusService);
  private readonly destroyRef  = inject(DestroyRef);

  readonly bonuses = signal<BonusModel[]>([]);

  readonly tableConfig: MasterDataTableConfig<BonusModel> = {
    title: 'Bonuses',
    showNewButton: true,
    showActiveFilter: true,
    columns: [
      { key: 'id',             label: 'ID',              sortable: false },
      { key: 'code',           label: 'Code' },
      { key: 'name',           label: 'Name' },
      { key: 'formulaEnabled', label: 'Formula',         type: 'icon', icon: 'functions', iconTooltip: 'Formula enabled', sortable: false },
      { key: 'isActive',       label: 'Active',          type: 'boolean' },
      { key: 'isTaxable',      label: 'Taxable',         type: 'boolean' },
      { key: 'liableForEpf',   label: 'Liable for EPF',  type: 'boolean' },
      { key: 'liableForEtf',   label: 'Liable for ETF',  type: 'boolean' },
      { key: 'liableForPaye',  label: 'Liable for PAYE', type: 'boolean' },
      { key: 'liableNoPay',    label: 'Liable No Pay',   type: 'boolean' },
    ],
  };

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.bonusSvc.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  data => this.bonuses.set(data),
        error: err  => console.error('Failed to load bonuses', err),
      });
  }

  onRowSelected(row: BonusModel): void {
    this.openDialog(row);
  }

  onNewClicked(): void {
    this.openDialog(null);
  }

  private openDialog(row: BonusModel | null): void {
    const dialogRef = this.dialog.open(BonusDialog, {
      panelClass: 'square-dialog',
      width: '600px',
      data: { row },
    });

    dialogRef.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: BonusDialogResult | undefined) => {
        if (!result) return;
        this.handleDialogResult(result);
      });
  }

  private handleDialogResult(result: BonusDialogResult): void {
    switch (result.action) {
      case 'create':
        this.bonusSvc.create(result.data)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(created => {
            this.bonuses.update(list => [...list, created]);
          });
        break;
      case 'update':
        this.bonusSvc.update(result.data.id, result.data)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(updated => {
            this.bonuses.update(list => list.map(b => b.id === updated.id ? updated : b));
          });
        break;
      case 'delete':
        this.bonusSvc.delete(result.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.bonuses.update(list => list.filter(b => b.id !== result.id));
          });
        break;
    }
  }
}
