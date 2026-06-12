import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BankService } from '../banks/bank.service';
import { Bank } from '../../../shared/models/master-data.models';
import { BankTransferTemplate } from '../../payroll/bank-transfer/bank-transfer.model';
import { BankTransferService } from '../../payroll/bank-transfer/bank-transfer.service';
import {
  BankTemplateDialog,
  BankTemplateDialogData,
  BankTemplateDialogResult,
} from '../../payroll/bank-transfer/bank-template-dialog/bank-template-dialog';

@Component({
  selector: 'app-bank-file-template',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './bank-file-template.html',
  styleUrl: './bank-file-template.scss',
})
export class BankFileTemplate {
  private readonly bankSvc     = inject(BankService);
  private readonly bankTmplSvc = inject(BankTransferService);
  private readonly dialog      = inject(MatDialog);
  private readonly destroyRef  = inject(DestroyRef);

  readonly banks        = signal<Bank[]>([]);
  readonly templates    = signal<BankTransferTemplate[]>([]);
  readonly loading      = signal(false);

  readonly columns = ['bankName', 'bankCode', 'headerLines', 'footerLines', 'actions'];

  constructor() { this.load(); }

  private load(): void {
    this.loading.set(true);
    forkJoin({ banks: this.bankSvc.getAll(), templates: this.bankTmplSvc.getTemplates() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ banks, templates }) => {
          this.banks.set(banks);
          this.templates.set(templates);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  openEditor(template: BankTransferTemplate): void {
    this.dialog
      .open<BankTemplateDialog, BankTemplateDialogData, BankTemplateDialogResult>(BankTemplateDialog, {
        panelClass: 'square-dialog',
        width: '780px',
        maxHeight: '92vh',
        data: {
          banks:         this.banks(),
          templates:     this.templates(),
          initialBankId: template.bankId,
        },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => { if (result) this.templates.set(result.templates); });
  }
}
