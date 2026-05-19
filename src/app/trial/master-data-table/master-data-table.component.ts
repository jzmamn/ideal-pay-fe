import { ChangeDetectionStrategy, Component, effect, inject, output, viewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MasterDataTableConfig } from './master-data-table-config';
import { CommonModule } from '@angular/common';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MasterDataTableDataService } from './master-data-table-data-service';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { EmployeeTestForm } from '../test-forms/test-forms';
import { lookupConfig } from './master-data-table-data';

@Component({
  selector: 'app-master-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule
  ],
  templateUrl: './master-data-table.component.html',
  styleUrl: './master-data-table.component.scss',
})
export class MasterDataTableComponent<T = any> {

  selected = output<T>();

  private sortRef = viewChild(MatSort);
  private paginatorRef = viewChild(MatPaginator);

  private masterDataTableDataService = inject(MasterDataTableDataService);
  private _liveAnnouncer = inject(LiveAnnouncer);

  readonly masterDataTableConfig: MasterDataTableConfig = lookupConfig;

  displayedColumns: string[] = this.masterDataTableConfig.displayedColumns;
  dataSource = new MatTableDataSource<EmployeeTestForm>(this.masterDataTableConfig.data);
  selectedRow: T | null = null;

  onSelect(row: T) {
    this.masterDataTableDataService.setSelectedRow(row);
  }

  isSelected(row: T): boolean {
    return this.selectedRow === row;
  }

  getValue(row: any, col: string) {
    return col.split('.').reduce((acc, part) => acc?.[part], row);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  announceSortChange(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  constructor() {
    effect(() => {
      const sort = this.sortRef();
      const paginator = this.paginatorRef();
      if (sort) this.dataSource.sort = sort;
      if (paginator) this.dataSource.paginator = paginator;
    });
  }
}
