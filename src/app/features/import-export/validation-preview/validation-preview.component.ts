import {
  ChangeDetectionStrategy, Component,
  computed, input,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ImportPreview, ImportRow } from '../import.service';

/**
 * Read-only preview of every staged row. Error rows are highlighted and each
 * failing cell carries a tooltip with the validation message.
 */
@Component({
  selector: 'app-validation-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './validation-preview.component.html',
  styleUrl: './validation-preview.component.scss',
})
export class ValidationPreviewComponent {
  readonly preview = input.required<ImportPreview>();

  readonly fields = computed(() => this.preview().expectedFields);

  errorMessage(row: ImportRow, field: string): string | null {
    return row.errors.find(e => e.field === field)?.message ?? null;
  }

  rowMessages(row: ImportRow): string {
    return row.errors.map(e => e.message).join(' · ');
  }
}
