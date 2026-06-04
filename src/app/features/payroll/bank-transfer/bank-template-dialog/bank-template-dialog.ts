import {
  ChangeDetectionStrategy, Component,
  DestroyRef, inject, signal, computed,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { Bank } from '../../../../shared/models/master-data.models';
import {
  BankTransferTemplate,
  TEMPLATE_TOKENS,
} from '../bank-transfer.model';
import { BankTransferService } from '../bank-transfer.service';

export interface BankTemplateDialogData {
  banks:     Bank[];
  templates: BankTransferTemplate[];
}

export interface BankTemplateDialogResult {
  templates: BankTransferTemplate[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function insertToken(current: string, token: string, cursorPos: number): string {
  return current.slice(0, cursorPos) + token + current.slice(cursorPos);
}

@Component({
  selector: 'app-bank-template-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatListModule,
  ],
  templateUrl: './bank-template-dialog.html',
  styleUrl:    './bank-template-dialog.scss',
})
export class BankTemplateDialog {
  private readonly dialogRef  = inject(MatDialogRef<BankTemplateDialog, BankTemplateDialogResult>);
  private readonly data       = inject<BankTemplateDialogData>(MAT_DIALOG_DATA);
  private readonly svc        = inject(BankTransferService);
  private readonly fb         = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly TOKENS = TEMPLATE_TOKENS;

  readonly banks     = this.data.banks;
  readonly templates = signal<BankTransferTemplate[]>([...this.data.templates]);

  readonly saving  = signal(false);
  readonly deleting = signal(false);
  readonly error   = signal<string | null>(null);

  readonly selectedBankId = signal<number | null>(null);

  readonly selectedBank = computed(() =>
    this.banks.find(b => b.id === this.selectedBankId()) ?? null
  );

  readonly existingTemplate = computed(() =>
    this.templates().find(t => t.bankId === this.selectedBankId()) ?? null
  );

  readonly form = this.fb.group({
    headerTemplate: this.fb.nonNullable.control(''),
    detailTemplate: this.fb.nonNullable.control('', Validators.required),
    footerTemplate: this.fb.nonNullable.control(''),
    fileExtension:  this.fb.nonNullable.control('txt', Validators.required),
  });

  /** Track textarea cursor positions for token insertion. */
  private _cursors: Record<string, number> = {
    headerTemplate: 0,
    detailTemplate: 0,
    footerTemplate: 0,
  };

  selectBank(bankId: number): void {
    this.selectedBankId.set(bankId);
    this.error.set(null);
    const tmpl = this.templates().find(t => t.bankId === bankId);
    this.form.reset({
      headerTemplate: tmpl?.headerTemplate ?? '',
      detailTemplate: tmpl?.detailTemplate ?? '',
      footerTemplate: tmpl?.footerTemplate ?? '',
      fileExtension:  tmpl?.fileExtension  ?? 'txt',
    });
  }

  trackCursor(field: string, event: Event): void {
    const el = event.target as HTMLTextAreaElement;
    this._cursors[field] = el.selectionStart ?? el.value.length;
  }

  insertToken(field: 'headerTemplate' | 'detailTemplate' | 'footerTemplate', token: string): void {
    const ctrl = this.form.controls[field];
    const pos  = this._cursors[field] ?? ctrl.value.length;
    ctrl.setValue(insertToken(ctrl.value, token, pos));
    this._cursors[field] = pos + token.length;
  }

  hasBankTemplate(bankId: number): boolean {
    return this.templates().some(t => t.bankId === bankId);
  }

  save(): void {
    const bank = this.selectedBank();
    if (!bank || this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set(null);

    const existing = this.existingTemplate();
    const payload: BankTransferTemplate = {
      ...(existing ? { id: existing.id } : {}),
      bankId:         bank.id,
      bankCode:       bank.code,
      bankName:       bank.name,
      ...this.form.getRawValue(),
    };

    this.svc.saveTemplate(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: saved => {
          this.templates.update(list => {
            const idx = list.findIndex(t => t.bankId === bank.id);
            return idx >= 0
              ? list.map((t, i) => i === idx ? saved : t)
              : [...list, saved];
          });
          this.saving.set(false);
        },
        error: () => {
          this.error.set('Save failed. Please try again.');
          this.saving.set(false);
        },
      });
  }

  deleteTemplate(): void {
    const tmpl = this.existingTemplate();
    if (!tmpl?.id || this.deleting()) return;
    this.deleting.set(true);
    this.error.set(null);

    this.svc.deleteTemplate(tmpl.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.templates.update(list => list.filter(t => t.id !== tmpl.id));
          this.form.reset({ headerTemplate: '', detailTemplate: '', footerTemplate: '', fileExtension: 'txt' });
          this.deleting.set(false);
        },
        error: () => {
          this.error.set('Delete failed. Please try again.');
          this.deleting.set(false);
        },
      });
  }

  close(): void {
    this.dialogRef.close({ templates: this.templates() });
  }
}
