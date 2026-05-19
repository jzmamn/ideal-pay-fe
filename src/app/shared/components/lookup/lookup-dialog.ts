import { AfterViewInit, ChangeDetectionStrategy, Component, inject, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { LookupConfig } from './lookup.config';
import { LookupDataService } from './lookup-data.service';

@Component({
  selector: 'app-lookup-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
  ],
  templateUrl: './lookup-dialog.html',
  styleUrl: './lookup-dialog.scss',
})
export class LookupDialog<T = any> implements AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private readonly lookupDataService = inject(LookupDataService);
  private readonly _liveAnnouncer = inject(LiveAnnouncer);

  readonly lookupConfig = inject<LookupConfig>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<LookupDialog>);

  displayedColumns: string[] = this.lookupConfig.displayedColumns;
  dataSource = new MatTableDataSource<any>(this.lookupConfig.data);
  selectedRow: T | null = null;

  onNoClick(): void {
    this.dialogRef.close();
  }

  onSelect(row: T): void {
    this.lookupDataService.setSelectedRow(row);
    this.dialogRef.close(row);
  }

  isSelected(row: T): boolean {
    return this.selectedRow === row;
  }

  getValue(row: any, col: string): unknown {
    return col.split('.').reduce((acc, part) => acc?.[part], row);
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  announceSortChange(sortState: Sort): void {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
}
