import {
  ChangeDetectionStrategy, Component, DestroyRef,
  inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  EmailConfigResponse,
  EmailSettingsService,
} from '../../settings/email-settings/email-settings.service';
import {
  EmailTemplate,
  EmailTemplateService,
  TEMPLATE_TYPE_LABELS,
} from './email-template.service';
import { SmtpConfigDialog, SmtpConfigDialogData } from './smtp-config-dialog/smtp-config-dialog';
import { TemplateDialog, TemplateDialogData } from './template-dialog/template-dialog';

@Component({
  selector: 'app-email-setup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './email-setup.html',
  styleUrl: './email-setup.scss',
})
export class EmailSetup {
  // ── DI ───────────────────────────────────────────────────────────────────────
  private readonly smtpSvc     = inject(EmailSettingsService);
  private readonly templateSvc = inject(EmailTemplateService);
  private readonly dialog      = inject(MatDialog);
  private readonly snackBar    = inject(MatSnackBar);
  private readonly destroyRef  = inject(DestroyRef);

  // ── SMTP configs state ────────────────────────────────────────────────────────
  readonly configs      = signal<EmailConfigResponse[]>([]);
  readonly smtpLoading  = signal(false);
  readonly testingId    = signal<number | null>(null);

  readonly smtpColumns  = ['name', 'host', 'port', 'username', 'useTls', 'isActive', 'actions'];

  // ── Template state ────────────────────────────────────────────────────────────
  readonly templates    = signal<EmailTemplate[]>([]);
  readonly templLoading = signal(false);
  readonly typeLabels: Record<string, string> = TEMPLATE_TYPE_LABELS;

  readonly templateColumns = ['name', 'templateType', 'emailConfigName', 'subject', 'isActive', 'actions'];

  // ── Init ──────────────────────────────────────────────────────────────────────
  constructor() {
    this.loadConfigs();
    this.loadTemplates();
  }

  // ── SMTP config methods ───────────────────────────────────────────────────────

  private loadConfigs(): void {
    this.smtpLoading.set(true);
    this.smtpSvc.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => { this.configs.set(list); this.smtpLoading.set(false); },
        error: ()   => this.smtpLoading.set(false),
      });
  }

  openSmtpDialog(config?: EmailConfigResponse): void {
    const ref = this.dialog.open(SmtpConfigDialog, {
      panelClass: 'square-dialog',
      width: '600px',
      data: { config } satisfies SmtpConfigDialogData,
    });

    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (!result) return;
        const call$ = config
          ? this.smtpSvc.update(config.id, result)
          : this.smtpSvc.create(result);

        call$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: saved => {
            const list = [...this.configs()];
            if (config) {
              const idx = list.findIndex(c => c.id === saved.id);
              if (idx !== -1) list[idx] = saved;
            } else {
              list.unshift(saved);
            }
            this.configs.set(list);
            this.snackBar.open(config ? 'Configuration updated.' : 'Configuration created.', 'Close', { duration: 3000 });
          },
          error: () => this.snackBar.open('Failed to save configuration.', 'Close', { duration: 4000 }),
        });
      });
  }

  activateConfig(config: EmailConfigResponse): void {
    this.smtpSvc.activate(config.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: activated => {
          this.configs.set(
            this.configs().map(c => ({ ...c, isActive: c.id === activated.id })),
          );
          this.snackBar.open(`"${activated.name}" set as active.`, 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to activate configuration.', 'Close', { duration: 4000 }),
      });
  }

  deactivateConfig(config: EmailConfigResponse): void {
    this.smtpSvc.deactivate(config.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: deactivated => {
          this.configs.set(
            this.configs().map(c => c.id === deactivated.id ? { ...c, isActive: false } : c),
          );
          this.snackBar.open(`"${deactivated.name}" deactivated.`, 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to deactivate configuration.', 'Close', { duration: 4000 }),
      });
  }

  testConfig(config: EmailConfigResponse): void {
    this.testingId.set(config.id);
    this.smtpSvc.testById(config.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.testingId.set(null);
          this.snackBar.open(res.message, 'Close', { duration: 5000 });
        },
        error: () => {
          this.testingId.set(null);
          this.snackBar.open('Connection test failed.', 'Close', { duration: 4000 });
        },
      });
  }

  deleteConfig(config: EmailConfigResponse): void {
    if (config.isActive) {
      this.snackBar.open('Cannot delete the active configuration. Activate another one first.', 'Close', { duration: 4000 });
      return;
    }
    if (!confirm(`Delete configuration "${config.name}"?`)) return;
    this.smtpSvc.delete(config.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.configs.set(this.configs().filter(c => c.id !== config.id));
          this.snackBar.open('Configuration deleted.', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to delete configuration.', 'Close', { duration: 4000 }),
      });
  }

  // ── Template methods ──────────────────────────────────────────────────────────

  private loadTemplates(): void {
    this.templLoading.set(true);
    this.templateSvc.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => { this.templates.set(list); this.templLoading.set(false); },
        error: ()   => this.templLoading.set(false),
      });
  }

  openTemplateDialog(template?: EmailTemplate): void {
    const ref = this.dialog.open(TemplateDialog, {
      panelClass: 'square-dialog',
      width: '680px',
      maxHeight: '92vh',
      data: { template, configs: this.configs() } satisfies TemplateDialogData,
    });

    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(result => {
        if (!result) return;
        const call$ = template
          ? this.templateSvc.update(template.id, result)
          : this.templateSvc.create(result);

        call$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: saved => {
            const list = [...this.templates()];
            if (template) {
              const idx = list.findIndex(t => t.id === saved.id);
              if (idx !== -1) list[idx] = saved;
            } else {
              list.push(saved);
            }
            this.templates.set(list);
            this.snackBar.open(template ? 'Template updated.' : 'Template created.', 'Close', { duration: 3000 });
          },
          error: () => this.snackBar.open('Failed to save template.', 'Close', { duration: 4000 }),
        });
      });
  }

  deleteTemplate(template: EmailTemplate): void {
    if (!confirm(`Delete template "${template.name}"?`)) return;
    this.templateSvc.delete(template.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.templates.set(this.templates().filter(t => t.id !== template.id));
          this.snackBar.open('Template deleted.', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to delete template.', 'Close', { duration: 4000 }),
      });
  }
}
