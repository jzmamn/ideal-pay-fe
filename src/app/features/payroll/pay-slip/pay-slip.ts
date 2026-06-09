import {
  ChangeDetectionStrategy, Component, DestroyRef,
  computed, inject, signal,
} from '@angular/core';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { DecimalPipe, LowerCasePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';

import { PayrollRunService } from '../shared/payroll-run.service';
import { PayrollRunResponse, PayrollRunSummary } from '../shared/payroll-run.model';
import { PayslipService } from './payslip.service';

import { TableAutocomplete, type TableColumn } from '../../../shared/components/table-autocomplete/table-autocomplete';
import { type EmployeeResponse } from '../../settings/employee/employee.model';
import { EmailTemplateService, EmailTemplate, TEMPLATE_VARIABLES } from '../../infrastructure/email-setup/email-template.service';
import {
  PayslipTemplateService,
  PayslipTemplateResponse,
} from '../../infrastructure/payslip-template/payslip-template.service';

// ── Constants ──────────────────────────────────────────────────────────────

const MONTHS = [
  { value: 1,  label: 'January'   },
  { value: 2,  label: 'February'  },
  { value: 3,  label: 'March'     },
  { value: 4,  label: 'April'     },
  { value: 5,  label: 'May'       },
  { value: 6,  label: 'June'      },
  { value: 7,  label: 'July'      },
  { value: 8,  label: 'August'    },
  { value: 9,  label: 'September' },
  { value: 10, label: 'October'   },
  { value: 11, label: 'November'  },
  { value: 12, label: 'December'  },
];

const TODAY = new Date();

// ── Financial-token warning dialog ────────────────────────────────────────

@Component({
  selector: 'app-financial-token-warning-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>
      <mat-icon aria-hidden="true" style="vertical-align:middle;margin-right:8px;color:var(--mat-sys-error)">warning</mat-icon>
      Sensitive Financial Data
    </h2>
    <mat-dialog-content>
      <p>This email template contains <strong>financial tokens</strong> (e.g. salary, deductions, net pay).
         Sending it will share sensitive payroll figures with the selected employees.</p>
      <p>Do you want to proceed?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancel</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">Send Anyway</button>
    </mat-dialog-actions>
  `,
})
export class FinancialTokenWarningDialog {}

// ── Component ──────────────────────────────────────────────────────────────

@Component({
  selector: 'app-pay-slip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    LowerCasePipe,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    TableAutocomplete,
  ],
  templateUrl: './pay-slip.html',
  styleUrl: './pay-slip.scss',
})
export class PaySlip {
  private readonly fb              = inject(FormBuilder);
  private readonly runSvc          = inject(PayrollRunService);
  private readonly payslipSvc      = inject(PayslipService);
  private readonly templateSvc     = inject(EmailTemplateService);
  private readonly pdfTemplateSvc  = inject(PayslipTemplateService);
  private readonly snackBar        = inject(MatSnackBar);
  private readonly dialog          = inject(MatDialog);
  private readonly destroyRef      = inject(DestroyRef);
  // DomSanitizer needed to trust blob: URLs for the PDF preview iframe
  private readonly sanitizer       = inject(DomSanitizer);

  // ── Static data ────────────────────────────────────────────────────────
  readonly months = MONTHS;
  readonly years  = [TODAY.getFullYear() - 1, TODAY.getFullYear(), TODAY.getFullYear() + 1];

  // ── Employee autocomplete columns ──────────────────────────────────────
  readonly employeeCols: TableColumn<EmployeeResponse>[] = [
    { key: 'employeeNo', label: 'Emp #'      },
    { key: 'firstName',  label: 'First Name' },
    { key: 'lastName',   label: 'Last Name'  },
  ];
  readonly empDisplayFn = (e: EmployeeResponse) =>
    `${e.firstName} ${e.lastName} — ${e.employeeNo}`;

  // ── Form ───────────────────────────────────────────────────────────────
  readonly periodForm = this.fb.group({
    month: this.fb.nonNullable.control(TODAY.getMonth() + 1, Validators.required),
    year:  this.fb.nonNullable.control(TODAY.getFullYear(),  Validators.required),
  });

  // ── Signals ────────────────────────────────────────────────────────────
  readonly batchRuns          = signal<PayrollRunSummary[]>([]);
  readonly detailRun          = signal<PayrollRunResponse | null>(null);
  readonly selectedEmployee   = signal<EmployeeResponse | null>(null);
  readonly checkedIds         = signal<Set<number>>(new Set());
  readonly pairedRunId        = signal<number | null>(null);
  readonly loading            = signal(false);
  readonly emailing           = signal(false);
  readonly pdfLoading         = signal(false);
  readonly showEmployeeSearch = signal(false);
  readonly payslipTemplates    = signal<EmailTemplate[]>([]);
  readonly selectedTemplateId  = signal<number | null>(null);

  // PDF templates (HTML→iText) — active templates only for the dropdown
  readonly pdfTemplates        = signal<PayslipTemplateResponse[]>([]);
  readonly selectedPdfTemplateId = signal<number | null>(null);
  readonly pdfTemplateLoading  = signal(false);

  // Sanitized blob: URL for the PDF preview <iframe>
  readonly pdfPreviewUrl      = signal<SafeResourceUrl | null>(null);

  // Keep the raw object URL so we can revoke it before replacing
  private _activePdfObjectUrl: string | null = null;

  // ── Init ───────────────────────────────────────────────────────────────
  constructor() {
    this.templateSvc.getActiveByType('PAYSLIP')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: list => this.payslipTemplates.set(list) });

    this.loadActivePdfTemplate();
  }

  loadActivePdfTemplate(): void {
    this.pdfTemplateLoading.set(true);
    this.pdfTemplateSvc.getAllActive()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => {
          this.pdfTemplates.set(list);
          this.selectedPdfTemplateId.set(list[0]?.id ?? null);
          this.pdfTemplateLoading.set(false);
        },
        error: () => this.pdfTemplateLoading.set(false),
      });
  }

  onPdfTemplateChange(id: number): void {
    this.selectedPdfTemplateId.set(id);
    if (!this.pdfPreviewUrl()) return;
    if (this.detailRun()) this.previewPdf();
    else if (this.checkedCount() > 0) this.previewBatch();
  }

  // ── Computed ───────────────────────────────────────────────────────────
  readonly payrollMonth = computed(() => {
    const { month, year } = this.periodForm.getRawValue();
    return `${year}-${String(month).padStart(2, '0')}`;
  });

  readonly periodLabel = computed(() => {
    const { month, year } = this.periodForm.getRawValue();
    return `${MONTHS.find(m => m.value === month)?.label ?? ''} ${year}`;
  });

  readonly allChecked = computed(() =>
    this.batchRuns().length > 0 &&
    this.batchRuns().every(r => this.checkedIds().has(r.id)));

  readonly someChecked = computed(() =>
    this.batchRuns().some(r => this.checkedIds().has(r.id)) && !this.allChecked());

  readonly checkedCount = computed(() => this.checkedIds().size);

  // ── Period ─────────────────────────────────────────────────────────────
  loadMonth(): void {
    if (this.periodForm.invalid) return;
    this.loading.set(true);
    this.batchRuns.set([]);
    this.detailRun.set(null);
    this.selectedEmployee.set(null);
    this.checkedIds.set(new Set());

    this.runSvc.getByMonth(this.payrollMonth())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next:  runs => { this.batchRuns.set(runs); this.loading.set(false); },
        error: ()   => {
          this.snackBar.open('Failed to load payroll runs.', 'Close', { duration: 4000 });
          this.loading.set(false);
        },
      });
  }

  // ── Employee selection ─────────────────────────────────────────────────
  onEmployeeSelected(item: unknown): void {
    const emp = item as EmployeeResponse;
    this.selectedEmployee.set(emp);
    this.detailRun.set(null);
    const existing = this.batchRuns().find(r => r.empId === emp.id);
    if (existing) this.loadRunDetail(existing.id);
  }

  // ── Checkboxes ─────────────────────────────────────────────────────────
  toggleAll(checked: boolean): void {
    this.checkedIds.set(checked ? new Set(this.batchRuns().map(r => r.id)) : new Set());
  }

  toggleRow(id: number, checked: boolean): void {
    this.checkedIds.update(s => {
      const next = new Set(s);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }

  isChecked(id: number): boolean { return this.checkedIds().has(id); }

  // ── View run ───────────────────────────────────────────────────────────
  viewRun(run: PayrollRunSummary): void { this.loadRunDetail(run.id); }

  loadRunDetail(runId: number): void {
    this.loading.set(true);
    this.runSvc.getById(runId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: run => {
          this.detailRun.set(run);
          this.loading.set(false);
          this.previewPdf();
        },
        error: () => {
          this.snackBar.open('Failed to load run detail.', 'Close', { duration: 4000 });
          this.loading.set(false);
        },
      });
  }

  // ── Pair selection ─────────────────────────────────────────────────────
  togglePair(runId: number): void {
    this.pairedRunId.update(current => current === runId ? null : runId);
  }

  isPaired(runId: number): boolean { return this.pairedRunId() === runId; }

  // ── PDF: download ──────────────────────────────────────────────────────
  /**
   * Streams the server-generated PDF as a Blob, creates a temporary <a>,
   * clicks it to trigger the browser Save dialog, then immediately revokes
   * the object URL to prevent memory leaks.
   */
  downloadPdf(): void {
    const run = this.detailRun();
    if (!run) return;
    this.pdfLoading.set(true);
    this.payslipSvc.downloadPdf(run.id, this.selectedPdfTemplateId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          const a   = document.createElement('a');
          a.href     = url;
          a.download = `payslip-${run.empCode ?? run.empId}-${run.payrollMonth}.pdf`;
          a.click();
          URL.revokeObjectURL(url); // revoke immediately — no longer needed
          this.pdfLoading.set(false);
        },
        error: (err: Error) => {
          this.pdfLoading.set(false);
          this.snackBar.open(err.message ?? 'PDF download failed.', 'Close', { duration: 5000 });
        },
      });
  }

  /**
   * Downloads an A4-landscape PDF with the selected (primary) run and the
   * paired run placed side by side.
   */
  downloadPdfPair(): void {
    const run1 = this.detailRun();
    const run2Id = this.pairedRunId();
    if (!run1 || run2Id === null) return;
    this.pdfLoading.set(true);
    this.payslipSvc.downloadPdfPair(run1.id, run2Id, this.selectedPdfTemplateId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          const a   = document.createElement('a');
          a.href     = url;
          a.download = `payslip-pair-${run1.id}-${run2Id}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          this.pdfLoading.set(false);
        },
        error: (err: Error) => {
          this.pdfLoading.set(false);
          this.snackBar.open(err.message ?? 'Pair PDF download failed.', 'Close', { duration: 5000 });
        },
      });
  }

  // ── PDF: inline preview ────────────────────────────────────────────────
  /**
   * Fetches the PDF blob and renders it in the inline <iframe>.
   * Revokes the previous blob URL before creating a new one.
   *
   * DomSanitizer.bypassSecurityTrustResourceUrl is required: Angular's XSS
   * guard blocks blob: URLs by default. We trust this one because we created
   * it ourselves from our own API's binary response.
   */
  previewPdf(): void {
    const run = this.detailRun();
    if (!run) return;
    this.pdfLoading.set(true);
    this.payslipSvc.downloadPdf(run.id, this.selectedPdfTemplateId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: blob => {
          if (this._activePdfObjectUrl) URL.revokeObjectURL(this._activePdfObjectUrl);
          this._activePdfObjectUrl = URL.createObjectURL(blob);
          this.pdfPreviewUrl.set(
            this.sanitizer.bypassSecurityTrustResourceUrl(this._activePdfObjectUrl),
          );
          this.pdfLoading.set(false);
        },
        error: (err: Error) => {
          this.pdfLoading.set(false);
          this.snackBar.open(err.message ?? 'PDF preview failed.', 'Close', { duration: 5000 });
        },
      });
  }

  // ── PDF: batch preview / download ─────────────────────────────────────

  previewBatch(): void {
    const ids = [...this.checkedIds()];
    if (!ids.length) return;
    this.pdfLoading.set(true);
    this.payslipSvc.downloadSelected(ids, this.selectedPdfTemplateId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: blob => {
          if (this._activePdfObjectUrl) URL.revokeObjectURL(this._activePdfObjectUrl);
          this._activePdfObjectUrl = URL.createObjectURL(blob);
          this.pdfPreviewUrl.set(
            this.sanitizer.bypassSecurityTrustResourceUrl(this._activePdfObjectUrl),
          );
          this.pdfLoading.set(false);
        },
        error: (err: Error) => {
          this.pdfLoading.set(false);
          this.snackBar.open(err.message ?? 'Batch preview failed.', 'Close', { duration: 5000 });
        },
      });
  }

  downloadBatch(): void {
    const ids = [...this.checkedIds()];
    if (!ids.length) return;
    this.pdfLoading.set(true);
    this.payslipSvc.downloadSelected(ids, this.selectedPdfTemplateId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: blob => {
          const url = URL.createObjectURL(blob);
          const a   = document.createElement('a');
          a.href     = url;
          a.download = `payslips-${this.payrollMonth()}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
          this.pdfLoading.set(false);
        },
        error: (err: Error) => {
          this.pdfLoading.set(false);
          this.snackBar.open(err.message ?? 'Batch download failed.', 'Close', { duration: 5000 });
        },
      });
  }

  /** Close the preview pane and revoke the blob URL. */
  closePdfPreview(): void {
    if (this._activePdfObjectUrl) {
      URL.revokeObjectURL(this._activePdfObjectUrl);
      this._activePdfObjectUrl = null;
    }
    this.pdfPreviewUrl.set(null);
  }

  /**
   * Print the PDF displayed in the preview iframe.
   * Calls contentWindow.print() so the browser print dialog is scoped
   * to the iframe document, not the whole page.
   */
  printPdf(): void {
    const iframe = document.querySelector<HTMLIFrameElement>('#pdf-preview-iframe');
    if (!iframe?.contentWindow) {
      this.snackBar.open('No PDF preview open — click "Preview PDF" first.', 'Close', { duration: 4000 });
      return;
    }
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }

  // ── Email ──────────────────────────────────────────────────────────────

  /** Returns true when the selected email template body/subject contains financial tokens. */
  private selectedTemplateHasFinancialTokens(): boolean {
    const id = this.selectedTemplateId();
    if (id == null) return false;
    const tpl = this.payslipTemplates().find(t => t.id === id);
    if (!tpl) return false;
    const financialTokens = TEMPLATE_VARIABLES['PAYSLIP'];
    const content = `${tpl.subject} ${tpl.body}`;
    return financialTokens.some(token => content.includes(token));
  }

  emailSelected(): void {
    const ids = [...this.checkedIds()];
    if (!ids.length) {
      this.snackBar.open('Select at least one employee to email.', 'Close', { duration: 3000 });
      return;
    }

    if (this.selectedTemplateHasFinancialTokens()) {
      const ref = this.dialog.open(FinancialTokenWarningDialog, {
        width: '420px',
        panelClass: 'square-dialog',
      });
      ref.afterClosed().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(confirmed => {
        if (confirmed) this.dispatchEmails(ids);
      });
    } else {
      this.dispatchEmails(ids);
    }
  }

  private dispatchEmails(ids: number[]): void {
    this.emailing.set(true);
    this.payslipSvc
      .emailPayslips({ runIds: ids, layout: 'portrait', templateId: this.selectedTemplateId(), pdfTemplateId: this.selectedPdfTemplateId() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.emailing.set(false);
          const msg = `Sent ${result.sent} payslip(s).${result.failed ? ' ' + result.failed + ' failed.' : ''}`;
          this.snackBar.open(msg, 'Close', { duration: 5000 });
        },
        error: () => {
          this.emailing.set(false);
          this.snackBar.open('Email dispatch failed.', 'Close', { duration: 4000 });
        },
      });
  }
}
