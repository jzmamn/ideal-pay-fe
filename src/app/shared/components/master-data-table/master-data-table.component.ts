import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MasterDataColumn, MasterDataTableConfig } from './master-data-table.config';

type ActiveFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-master-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DatePipe, DecimalPipe],
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './master-data-table.component.html',
  styleUrl: './master-data-table.component.scss',
})
export class MasterDataTableComponent<T extends object = Record<string, unknown>> {
  readonly config = input.required<MasterDataTableConfig<T>>();
  readonly data = input<T[]>([]);

  readonly rowSelected = output<T>();
  readonly newClicked = output<void>();

  private readonly sortRef = viewChild(MatSort);
  private readonly paginatorRef = viewChild(MatPaginator);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly datePipe = inject(DatePipe);
private readonly decimalPipe = inject(DecimalPipe);

  readonly selectedRow = signal<T | null>(null);
  readonly activeFilter = signal<ActiveFilter>('active');
  readonly dataSource = new MatTableDataSource<T>([]);
  readonly displayedColumns = computed(() => this.config().columns.map(c => c.key));

  readonly filteredData = computed(() => {
    const filter = this.activeFilter();
    if (filter === 'all') return this.data();
    return this.data().filter(row => {
      const active = (row as Record<string, unknown>)['isActive'];
      return filter === 'active' ? !!active : !active;
    });
  });

  constructor() {
    effect(() => {
      this.dataSource.data = this.filteredData();
    });

    effect(() => {
      const sort = this.sortRef();
      const paginator = this.paginatorRef();
      if (sort) this.dataSource.sort = sort;
      if (paginator) this.dataSource.paginator = paginator;
    });
  }

  onRowClick(row: T): void {
    this.selectedRow.set(row);
    this.rowSelected.emit(row);
  }

  isSelected(row: T): boolean {
    return this.selectedRow() === row;
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
      this.liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this.liveAnnouncer.announce('Sorting cleared');
    }
  }

  getColumnType(col: MasterDataColumn<T>): string {
    return col.type ?? 'text';
  }

  getCellValue(row: T, key: string): unknown {
    return key.split('.').reduce((acc: unknown, part) => {
      return acc != null ? (acc as Record<string, unknown>)[part] : undefined;
    }, row as unknown);
  }

  formatCellValue(row: T, col: MasterDataColumn<T>): string {
    const value = this.getCellValue(row, col.key);
    if (value == null) return '';
    switch (col.type) {
      case 'date':
        return this.datePipe.transform(value as Date | string, 'mediumDate') ?? '';
      case 'currency':
        return this.decimalPipe.transform(value as number, '1.2-2') ?? '';
      case 'number':
        return this.decimalPipe.transform(value as number) ?? '';
      default:
        return String(value);
    }
  }
}
