import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MasterDataTableComponent } from '../../../shared/components/master-data-table/master-data-table.component';
import { MasterDataTableConfig } from '../../../shared/components/master-data-table/master-data-table.config';
import { LoanDialog } from './loan-dialog';
import { LoanModel } from './loan.model';

const MOCK_LOANS: LoanModel[] = [
  new LoanModel(1, 'LN01', 'Personal Loan',       true),
  new LoanModel(2, 'LN02', 'Emergency Loan',       true),
  new LoanModel(3, 'LN03', 'Housing Loan',         true),
  new LoanModel(4, 'LN04', 'Vehicle Loan',         true),
  new LoanModel(5, 'LN05', 'Education Loan',       false),
];

@Component({
  selector: 'app-loan',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MasterDataTableComponent],
  templateUrl: './loan.html',
  styleUrl: './loan.scss',
})
export class Loan {
  private readonly dialog = inject(MatDialog);

  readonly loans = signal<LoanModel[]>(MOCK_LOANS);

  readonly tableConfig: MasterDataTableConfig<LoanModel> = {
    title: 'Loan',
    showNewButton: true,
    showActiveFilter: true,
    columns: [
      { key: 'id',       label: 'ID',     sortable: false },
      { key: 'code',     label: 'Code' },
      { key: 'name',     label: 'Name' },
      { key: 'isActive', label: 'Active', type: 'boolean' },
    ],
  };

  onRowSelected(row: LoanModel): void {
    this.openDialog(row);
  }

  onNewClicked(): void {
    this.openDialog(null);
  }

  private openDialog(row: LoanModel | null): void {
    this.dialog.open(LoanDialog, {
      panelClass: 'square-dialog',
      width: '600px',
      data: row,
    });
  }
}
