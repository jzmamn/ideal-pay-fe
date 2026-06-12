import {
  ChangeDetectionStrategy, Component,
  computed, inject, signal, viewChild,
} from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  IMPORT_ENTITIES, ImportEntity, ImportFormat, ImportFormatSpec,
  ImportPreview, ImportService,
} from '../import.service';
import { ValidationPreviewComponent } from '../validation-preview/validation-preview.component';
import { ExportButtonComponent } from '../export-button/export-button.component';

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

/**
 * Four-step import wizard:
 * 1. pick entity + payroll month + file → upload & stage
 * 2. map file columns to expected fields → re-validate
 * 3. row-by-row validation preview
 * 4. confirm & commit → import log
 */
@Component({
  selector: 'app-import-wizard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, RouterLink,
    MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule,
    MatProgressSpinnerModule, MatSelectModule, MatStepperModule,
    ValidationPreviewComponent, ExportButtonComponent,
  ],
  templateUrl: './import-wizard.component.html',
  styleUrl: './import-wizard.component.scss',
})
export class ImportWizardComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly importSvc = inject(ImportService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  private readonly stepper = viewChild.required(MatStepper);

  readonly entities = IMPORT_ENTITIES;

  readonly setupForm = this.fb.group({
    entity: this.fb.control<ImportEntity>('EMP_NOPAY', Validators.required),
    payrollMonth: this.fb.control(ImportWizardComponent.currentMonth(), [
      Validators.required, Validators.pattern(MONTH_PATTERN),
    ]),
  });

  // ── Format metadata ────────────────────────────────────────────────────
  private readonly formats = toSignal(this.importSvc.getFormats(), {
    initialValue: [] as ImportFormatSpec[],
  });
  private readonly selectedEntity = toSignal(
    this.setupForm.controls.entity.valueChanges,
    { initialValue: this.setupForm.controls.entity.value },
  );
  readonly selectedFormat = computed(() =>
    this.formats().find(f => f.entity === this.selectedEntity()) ?? null);

  // ── State ──────────────────────────────────────────────────────────────
  readonly file = signal<File | null>(null);
  readonly preview = signal<ImportPreview | null>(null);
  readonly mapping = signal<Record<string, string>>({});
  readonly busy = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly canCommit = computed(() => {
    const p = this.preview();
    return p !== null && p.validRows > 0 && !this.busy();
  });

  // ── Step 1: file / entity / month ─────────────────────────────────────

  onFileSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    this.file.set(files && files.length > 0 ? files[0] : null);
  }

  downloadTemplate(format: ImportFormat): void {
    const entity = this.setupForm.getRawValue().entity;
    this.importSvc.downloadTemplate(entity, format).subscribe({
      next: blob => this.importSvc.saveBlob(
        blob, `${entity.toLowerCase()}_template.${format}`),
      error: () => this.snackBar.open('Template download failed', 'Dismiss', { duration: 4000 }),
    });
  }

  upload(): void {
    const file = this.file();
    if (!file || this.setupForm.invalid || this.busy()) { return; }
    const { entity, payrollMonth } = this.setupForm.getRawValue();

    this.busy.set(true);
    this.errorMessage.set(null);
    this.importSvc.upload(file, entity, payrollMonth).subscribe({
      next: preview => {
        this.preview.set(preview);
        this.mapping.set({ ...preview.mapping });
        this.busy.set(false);
        this.stepper().next();
      },
      error: err => this.fail(err),
    });
  }

  // ── Step 2: column mapping ────────────────────────────────────────────

  mappedHeader(field: string): string {
    return this.mapping()[field] ?? '';
  }

  setMapping(field: string, header: string): void {
    this.mapping.update(current => {
      const next = { ...current };
      if (header) {
        next[field] = header;
      } else {
        delete next[field];
      }
      return next;
    });
  }

  revalidate(): void {
    const p = this.preview();
    if (!p || this.busy()) { return; }

    this.busy.set(true);
    this.errorMessage.set(null);
    this.importSvc.validate(p.sessionId, this.mapping()).subscribe({
      next: preview => {
        this.preview.set(preview);
        this.busy.set(false);
        this.stepper().next();
      },
      error: err => this.fail(err),
    });
  }

  // ── Step 4: commit ────────────────────────────────────────────────────

  commit(): void {
    const p = this.preview();
    if (!p || !this.canCommit()) { return; }

    this.busy.set(true);
    this.errorMessage.set(null);
    this.importSvc.commit(p.sessionId).subscribe({
      next: result => {
        this.busy.set(false);
        this.snackBar.open(
          `Imported ${result.insertedRows} rows`
            + (result.skippedRows > 0 ? ` (${result.skippedRows} skipped)` : ''),
          'OK', { duration: 5000 });
        void this.router.navigate(['/import-export/log']);
      },
      error: err => this.fail(err),
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  entityLabel(entity: ImportEntity): string {
    return IMPORT_ENTITIES.find(e => e.value === entity)?.label ?? entity;
  }

  private fail(err: unknown): void {
    this.busy.set(false);
    const message = err instanceof HttpErrorResponse
      ? (typeof err.error === 'object' && err.error !== null
          && 'message' in err.error && typeof err.error.message === 'string'
          ? err.error.message
          : err.message)
      : 'Something went wrong';
    this.errorMessage.set(message);
  }

  private static currentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
