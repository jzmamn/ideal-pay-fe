import { Component, inject, signal, input, output, ChangeDetectionStrategy } from '@angular/core';
import { LookupConfig } from './lookup.config';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, MatLabel } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { LookupDialog } from './lookup-dialog';
import { MatDialog } from '@angular/material/dialog';
import { LookupDataService } from './lookup-data.service';

@Component({
  selector: 'app-lookup',
  templateUrl: './lookup.component.html',
  styleUrls: ['./lookup.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatCheckboxModule,
    MatCardModule,
    MatIconModule,
    MatLabel,
    MatTableModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LookupComponent<T = any> {

  config = input<LookupConfig<T>>();
  appearance = input<'fill' | 'outline'>('outline');
  label = input<string>('Search');
  selected = output<T>();

  row = inject(LookupDataService);
  readonly name = signal('');

  selectedRow: T | null = null;

  onSelect(row: T) {
    this.selectedRow = row;
    this.selected.emit(row);
  }

  isSelected(row: T): boolean {
    return this.selectedRow === row;
  }

  getValue(row: any, col: string) {
    return col.split('.').reduce((acc, part) => acc?.[part], row);
  }

  readonly dialog = inject(MatDialog);

  openDialog(): void {
    const cfg = this.config();
    if (!cfg) return;

    const dialogRef = this.dialog.open(LookupDialog, {
      panelClass: 'square-dialog',
      height: '400px',
      width: '600px',
      data: cfg,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result !== undefined) {
        this.name.set(result.name);
        this.selected.emit(result);
      }
    });
  }
}