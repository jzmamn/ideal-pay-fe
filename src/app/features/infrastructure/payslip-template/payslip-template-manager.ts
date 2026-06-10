import {
  ChangeDetectionStrategy, Component, DestroyRef,
  inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { forkJoin } from 'rxjs';
import {
  PayslipTemplateResponse,
  PayslipTemplateService,
} from './payslip-template.service';
import {
  PayslipTemplateDialog,
  PayslipTemplateDialogData,
} from './template-dialog/payslip-template-dialog';
import { BankService } from '../../infrastructure/banks/bank.service';
import { Bank } from '../../../shared/models/master-data.models';
import {
  BankTransferTemplate,
} from '../../payroll/bank-transfer/bank-transfer.model';
import { BankTransferService } from '../../payroll/bank-transfer/bank-transfer.service';
import {
  BankTemplateDialog,
  BankTemplateDialogData,
  BankTemplateDialogResult,
} from '../../payroll/bank-transfer/bank-template-dialog/bank-template-dialog';

// Hardcoded to user 1 — consistent with the rest of the codebase (no JWT user ID yet)
const CURRENT_USER_ID = 1;

@Component({
  selector: 'app-payslip-template-manager',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule,
  ],
  templateUrl: './payslip-template-manager.html',
  styleUrl:    './payslip-template-manager.scss',
})
export class PayslipTemplateManager {
  private readonly svc        = inject(PayslipTemplateService);
  private readonly bankSvc    = inject(BankService);
  private readonly bankTmplSvc = inject(BankTransferService);
  private readonly dialog     = inject(MatDialog);
  private readonly snackBar   = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly templates      = signal<PayslipTemplateResponse[]>([]);
  readonly loading        = signal(false);
  readonly banks          = signal<Bank[]>([]);
  readonly bankTemplates  = signal<BankTransferTemplate[]>([]);
  readonly bankRefLoading = signal(false);

  readonly columns     = ['name', 'status', 'modifiedBy', 'modifiedDate', 'actions'];
  readonly bankColumns = ['bankName', 'bankCode', 'headerLines', 'footerLines'];

  constructor() { this.load(); }

  private load(): void {
    // Payslip templates
    this.loading.set(true);
    this.svc.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => { this.templates.set(list); this.loading.set(false); },
        error: ()  => this.loading.set(false),
      });

    // Bank file templates
    this.bankRefLoading.set(true);
    forkJoin({ banks: this.bankSvc.getAll(), templates: this.bankTmplSvc.getTemplates() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ banks, templates }) => {
          this.banks.set(banks);
          this.bankTemplates.set(templates);
          this.bankRefLoading.set(false);
        },
        error: () => this.bankRefLoading.set(false),
      });
  }

  openDialog(template?: PayslipTemplateResponse): void {
    const ref = this.dialog.open(PayslipTemplateDialog, {
      panelClass : 'square-dialog',
      width      : '1000px',
      maxWidth   : '98vw',
      height     : '98vh',
      maxHeight  : '98vh',
      data       : { template } satisfies PayslipTemplateDialogData,
    });

    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (!result) return;

        const req = {
          ...result,
          createdBy : CURRENT_USER_ID,
          modifiedBy: CURRENT_USER_ID,
        };

        const call$ = template
          ? this.svc.update(template.id, req)
          : this.svc.save(req);

        call$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: saved => {
            const next = saved;
            const list = [...this.templates()];
            if (template) {
              const idx = list.findIndex(t => t.id === next.id);
              if (idx !== -1) list[idx] = next;
            } else {
              list.unshift(next);
            }
            this.templates.set(list);
            this.snackBar.open(
              template ? 'Template updated.' : 'Template created.',
              'Close', { duration: 3000 },
            );
          },
          error: () => this.snackBar.open('Failed to save template.', 'Close', { duration: 4000 }),
        });
      });
  }

  previewHtml(template: PayslipTemplateResponse): void {
    const win = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
    if (win) {
      win.document.write(template.htmlContent);
      win.document.close();
    }
  }

  openBankTemplateManager(): void {
    this.dialog
      .open<BankTemplateDialog, BankTemplateDialogData, BankTemplateDialogResult>(BankTemplateDialog, {
        width: '860px', maxHeight: '90vh',
        data: { banks: this.banks(), templates: this.bankTemplates() },
      })
      .afterClosed()
      .subscribe(result => { if (result) this.bankTemplates.set(result.templates); });
  }
}
