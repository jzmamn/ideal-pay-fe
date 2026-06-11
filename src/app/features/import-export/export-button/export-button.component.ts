import {
  ChangeDetectionStrategy, Component,
  inject, input, signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ImportEntity, ImportFormat, ImportService } from '../import.service';

/**
 * Reusable export trigger: fetches the streamed XLSX/CSV for an entity +
 * payroll month and hands it to the browser as a download.
 */
@Component({
  selector: 'app-export-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <button mat-stroked-button type="button"
            [disabled]="busy() || !payrollMonth()"
            [matTooltip]="'Export ' + format().toUpperCase() + ' for ' + payrollMonth()"
            [attr.aria-label]="'Export as ' + format().toUpperCase()"
            (click)="export()">
      <mat-icon aria-hidden="true">{{ busy() ? 'hourglass_top' : 'download' }}</mat-icon>
      {{ busy() ? 'Exporting…' : 'Export ' + format().toUpperCase() }}
    </button>
  `,
})
export class ExportButtonComponent {
  private readonly importSvc = inject(ImportService);
  private readonly snackBar = inject(MatSnackBar);

  readonly entity = input.required<ImportEntity>();
  readonly payrollMonth = input.required<string>();
  readonly format = input<ImportFormat>('xlsx');

  readonly busy = signal(false);

  export(): void {
    if (this.busy()) { return; }
    this.busy.set(true);
    const entity = this.entity();
    const month = this.payrollMonth();
    const format = this.format();

    this.importSvc.exportData(entity, month, format).subscribe({
      next: blob => {
        this.importSvc.saveBlob(blob, `${entity.toLowerCase()}_${month}.${format}`);
        this.busy.set(false);
      },
      error: () => {
        this.busy.set(false);
        this.snackBar.open('Export failed — please try again', 'Dismiss', { duration: 4000 });
      },
    });
  }
}
