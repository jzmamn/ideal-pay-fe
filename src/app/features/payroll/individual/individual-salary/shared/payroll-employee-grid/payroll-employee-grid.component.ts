import {
  ChangeDetectionStrategy, Component, computed,
  input, output, signal,
} from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GridColumnDef, PayrollEntryRow } from '../../payroll.models';

export interface RowChangedEvent {
  row  : PayrollEntryRow;
  field: string;
  value: unknown;
}

export interface BulkActionEvent {
  action     : string;
  selectedIds: number[];
}

@Component({
  selector: 'app-payroll-employee-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule, MatCheckboxModule, MatFormFieldModule,
    MatIconModule, MatInputModule, MatSelectModule, MatTooltipModule,
  ],
  templateUrl: './payroll-employee-grid.component.html',
  styleUrl: './payroll-employee-grid.component.scss',
})
export class PayrollEmployeeGridComponent {
  readonly columns    = input.required<GridColumnDef[]>();
  readonly rows       = input.required<PayrollEntryRow[]>();
  readonly loading    = input<boolean>(false);
  readonly readonlyFn = input<(row: PayrollEntryRow) => boolean>(() => false);

  readonly rowChanged = output<RowChangedEvent>();
  readonly bulkAction = output<BulkActionEvent>();

  readonly searchCtrl      = new FormControl('', { nonNullable: true });
  readonly deptFilter      = new FormControl('', { nonNullable: true });
  readonly showFilter      = signal<'all' | 'modified' | 'errors'>('all');
  readonly selectedIds     = signal<Set<number>>(new Set());
  readonly dirtyIds        = signal<Set<number>>(new Set());
  readonly pageSize        = signal(50);
  readonly pageIndex       = signal(0);
  readonly editingCell     = signal<{ rowId: number; field: string } | null>(null);
  readonly editingValue    = signal<unknown>(null);
  readonly cellErrors      = signal<Map<string, string>>(new Map());

  readonly filteredRows = computed(() => {
    const q    = this.searchCtrl.value.toLowerCase();
    const dept = this.deptFilter.value;
    const show = this.showFilter();
    return this.rows().filter(r => {
      if (q && !r.fullName.toLowerCase().includes(q) && !r.empCode.toLowerCase().includes(q)) return false;
      if (dept && r.department !== dept) return false;
      if (show === 'modified' && !this.dirtyIds().has(r.id)) return false;
      if (show === 'errors'   && !this._hasError(r.id)) return false;
      return true;
    });
  });

  readonly pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredRows().length / this.pageSize())));

  readonly departments = computed(() =>
    [...new Set(this.rows().map(r => r.department))].sort());

  readonly allOnPageSelected = computed(() => {
    const ids = this.selectedIds();
    return this.pagedRows().length > 0 && this.pagedRows().every(r => ids.has(r.id));
  });

  isSelected(id: number): boolean { return this.selectedIds().has(id); }

  toggleRow(id: number): void {
    this.selectedIds.update(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  toggleAll(): void {
    const allSel = this.allOnPageSelected();
    this.selectedIds.update(s => {
      const next = new Set(s);
      this.pagedRows().forEach(r => allSel ? next.delete(r.id) : next.add(r.id));
      return next;
    });
  }

  startEdit(row: PayrollEntryRow, field: string, value: unknown): void {
    if (this.readonlyFn()(row)) return;
    const col = this.columns().find(c => c.field === field);
    if (!col) return;
    const editable = typeof col.editable === 'function' ? col.editable(row) : (col.editable ?? false);
    if (!editable) return;
    this.editingCell.set({ rowId: row.id, field });
    this.editingValue.set(value);
  }

  commitEdit(row: PayrollEntryRow, field: string): void {
    const col = this.columns().find(c => c.field === field);
    const value = this.editingValue();
    if (col?.validator) {
      const err = col.validator(value, row);
      if (err) {
        this.cellErrors.update(m => new Map(m).set(`${row.id}:${field}`, err));
        return;
      } else {
        this.cellErrors.update(m => { const n = new Map(m); n.delete(`${row.id}:${field}`); return n; });
      }
    }
    this.dirtyIds.update(s => new Set([...s, row.id]));
    this.rowChanged.emit({ row, field, value });
    this.editingCell.set(null);
  }

  cancelEdit(): void { this.editingCell.set(null); }

  isEditing(rowId: number, field: string): boolean {
    const c = this.editingCell();
    return c?.rowId === rowId && c?.field === field;
  }

  cellError(rowId: number, field: string): string | null {
    return this.cellErrors().get(`${rowId}:${field}`) ?? null;
  }

  isDirty(id: number): boolean { return this.dirtyIds().has(id); }

  prevPage(): void { this.pageIndex.update(p => Math.max(0, p - 1)); }
  nextPage(): void { this.pageIndex.update(p => Math.min(this.totalPages() - 1, p + 1)); }
  setPageSize(size: number): void { this.pageSize.set(size); this.pageIndex.set(0); }

  exportCsv(): void {
    const cols = this.columns();
    const header = cols.map(c => c.header).join(',');
    const body   = this.filteredRows().map(row =>
      cols.map(c => {
        const v = (row as unknown as Record<string, unknown>)[c.field];
        return c.formatter ? c.formatter(v, row) : String(v ?? '');
      }).join(','),
    ).join('\n');
    const blob = new Blob([header + '\n' + body], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'payroll-grid.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  onBulkFill(field: string, value: unknown): void {
    this.bulkAction.emit({ action: `fill:${field}:${value}`, selectedIds: [...this.selectedIds()] });
  }

  private _hasError(id: number): boolean {
    return [...this.cellErrors().keys()].some(k => k.startsWith(`${id}:`));
  }

  cellDisplay(col: GridColumnDef, row: PayrollEntryRow): string {
    const v = (row as unknown as Record<string, unknown>)[col.field];
    if (col.formatter) return col.formatter(v, row);
    if (typeof v === 'number') return v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return String(v ?? '—');
  }

  trackById(_: number, row: PayrollEntryRow): number { return row.id; }
}
