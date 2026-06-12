import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef,
  inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { CodeDropdownService } from '../../../payroll/shared/code-dropdown.service';

export interface PayslipTemplateDialogData {
  template?: PayslipTemplateResponse;
}

type TokenGroup = { group: string; tokens: string[]; dynamicPrefixes?: string[] };

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
  private readonly fb          = inject(FormBuilder);
  private readonly dialogRef   = inject(MatDialogRef<PayslipTemplateDialog>);
  private readonly codesSvc    = inject(CodeDropdownService);
  private readonly destroyRef  = inject(DestroyRef);
  readonly data                = inject<PayslipTemplateDialogData>(MAT_DIALOG_DATA);

  readonly isEdit      = signal(!!this.data?.template);

  // Start with static tokens; dynamic component groups are appended once loaded
  readonly tokenGroups = signal<TokenGroup[]>(PAYSLIP_TOKENS);

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

  constructor() {
    this.codesSvc.getActiveCodes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: codes => {
          const dynamicGroups: TokenGroup[] = [];

          // FA / FD / VA / VD — value + label only
          const addGroup = (
            label: string,
            items: { code: string; name: string }[],
          ) => {
            if (!items?.length) return;
            const tokens: string[] = [];
            for (const item of items) {
              const key = item.code.toUpperCase();
              tokens.push(`{{${key}}}`);         // e.g. {{FA001}}
              tokens.push(`{{lbl_${key}}}`);     // e.g. {{lbl_FA001}}
            }
            dynamicGroups.push({ group: label, tokens });
          };

          // OT — label + hours + amount (no bare value token)
          const addOtGroup = (items: { code: string; name: string }[]) => {
            if (!items?.length) return;
            const tokens: string[] = [];
            for (const item of items) {
              const key = item.code.toUpperCase();
              tokens.push(`{{lbl_${key}}}`);          // {{lbl_OT001}}
              tokens.push(`{{${key}_HOURS}}`);        // {{OT001_HOURS}}
              tokens.push(`{{${key}_AMOUNT}}`);       // {{OT001_AMOUNT}}
            }
            dynamicGroups.push({ group: 'Overtime', tokens });
          };

          // NOPAY — label + days + amount (no bare value token)
          const addNopayGroup = (items: { code: string; name: string }[]) => {
            if (!items?.length) return;
            const tokens: string[] = [];
            for (const item of items) {
              const key = item.code.toUpperCase();
              tokens.push(`{{lbl_${key}}}`);          // {{lbl_NP001}}
              tokens.push(`{{${key}_DAYS}}`);         // {{NP001_DAYS}}
              tokens.push(`{{${key}_AMOUNT}}`);       // {{NP001_AMOUNT}}
            }
            dynamicGroups.push({ group: 'No-Pay', tokens });
          };

          addGroup('Fixed Allowances',    codes.fixedAllowances);
          addGroup('Fixed Deductions',    codes.fixedDeductions);
          addOtGroup(codes.overtimes);
          addNopayGroup(codes.nopayDays);
          addGroup('Variable Allowances', codes.variableAllowances);
          addGroup('Variable Deductions', codes.variableDeductions);

          // Replace the placeholder "Dynamic Component Tokens" group with real groups
          const staticGroups = PAYSLIP_TOKENS.filter(
            g => g.group !== 'Dynamic Component Tokens',
          );
          this.tokenGroups.set([...staticGroups, ...dynamicGroups]);
        },
        // On error keep the static placeholder groups — don't break the dialog
      });
  }

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
