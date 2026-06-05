import {
  ChangeDetectionStrategy, Component, ElementRef,
  inject, signal, viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  PAYSLIP_TOKENS,
  PayslipTemplateResponse,
} from '../payslip-template.service';

export interface PayslipTemplateDialogData {
  template?: PayslipTemplateResponse;
}

@Component({
  selector: 'app-payslip-template-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display:flex; flex-direction:column; height:100%;' },
  imports: [
    DecimalPipe,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  templateUrl: './payslip-template-dialog.html',
  styleUrl: './payslip-template-dialog.scss',
})
export class PayslipTemplateDialog {
  private readonly fb        = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<PayslipTemplateDialog>);
  readonly data              = inject<PayslipTemplateDialogData>(MAT_DIALOG_DATA);

  readonly isEdit      = signal(!!this.data?.template);
  readonly tokenGroups = PAYSLIP_TOKENS;

  private readonly htmlTextarea = viewChild<ElementRef<HTMLTextAreaElement>>('htmlTextarea');

  readonly form = this.fb.group({
    name: this.fb.nonNullable.control(
      this.data?.template?.name ?? '',
      [Validators.required, Validators.maxLength(150)],
    ),
    htmlContent: this.fb.nonNullable.control(
      this.data?.template?.htmlContent ?? '',
      Validators.required,
    ),
    isActive: this.fb.nonNullable.control(this.data?.template?.isActive ?? true),
  });

  /** Inserts a token at the current cursor position inside the HTML textarea. */
  insertToken(token: string): void {
    const ctrl = this.form.controls.htmlContent;
    const el   = this.htmlTextarea()?.nativeElement;

    if (el) {
      const start  = el.selectionStart ?? ctrl.value.length;
      const end    = el.selectionEnd   ?? start;
      const before = ctrl.value.slice(0, start);
      const after  = ctrl.value.slice(end);
      ctrl.setValue(before + token + after);
      ctrl.markAsDirty();

      setTimeout(() => {
        el.focus();
        const pos = start + token.length;
        el.setSelectionRange(pos, pos);
      });
    } else {
      ctrl.setValue(ctrl.value + token);
      ctrl.markAsDirty();
    }
  }

  /** Opens the current HTML content in a new browser tab for a live preview. */
  previewHtml(): void {
    const html = this.form.controls.htmlContent.value;
    if (!html) return;
    const win = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
    if (win) { win.document.write(html); win.document.close(); }
  }

  /** Copies the HTML content to the clipboard. */
  copyHtml(): void {
    const html = this.form.controls.htmlContent.value;
    if (html) navigator.clipboard.writeText(html);
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.getRawValue());
  }
}
