import {
  ChangeDetectionStrategy, Component, inject, signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  EmailTemplate,
  TEMPLATE_TYPE_LABELS,
  TEMPLATE_VARIABLES,
  TemplateType,
} from '../email-template.service';
import { EmailConfigResponse } from '../../../settings/email-settings/email-settings.service';

export interface TemplateDialogData {
  template?: EmailTemplate;
  configs  : EmailConfigResponse[];
}

@Component({
  selector: 'app-template-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ isEdit() ? 'Edit' : 'New' }} Email Template</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="template-form" novalidate>

        <!-- Name -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Template Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Payslip Notification" />
          <mat-icon matPrefix>label</mat-icon>
          @if (form.controls.name.invalid && form.controls.name.touched) {
            <mat-error>Name is required.</mat-error>
          }
        </mat-form-field>

        <!-- Type -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Template Type</mat-label>
          <mat-select formControlName="templateType">
            @for (type of typeOptions; track type.value) {
              <mat-option [value]="type.value">{{ type.label }}</mat-option>
            }
          </mat-select>
          <mat-icon matPrefix>category</mat-icon>
          @if (form.controls.templateType.invalid && form.controls.templateType.touched) {
            <mat-error>Type is required.</mat-error>
          }
        </mat-form-field>

        <!-- SMTP Config -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>SMTP Config (optional)</mat-label>
          <mat-select formControlName="emailConfigId">
            <mat-option [value]="null">— Use active config —</mat-option>
            @for (cfg of data.configs; track cfg.id) {
              <mat-option [value]="cfg.id">
                {{ cfg.name }}@if (cfg.isActive) { <span> (active)</span> }
              </mat-option>
            }
          </mat-select>
          <mat-icon matPrefix>dns</mat-icon>
        </mat-form-field>

        <!-- Subject -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Subject</mat-label>
          <input matInput formControlName="subject" placeholder="e.g. Your Payslip for {{'{{'}}month{{'}}'}}" />
          <mat-icon matPrefix>subject</mat-icon>
          @if (form.controls.subject.invalid && form.controls.subject.touched) {
            <mat-error>Subject is required.</mat-error>
          }
        </mat-form-field>

        <!-- Body -->
        <mat-form-field appearance="outline" subscriptSizing="dynamic" class="body-field">
          <mat-label>Email Body (HTML supported)</mat-label>
          <textarea
            matInput
            formControlName="body"
            rows="12"
            placeholder="<p>Dear {{'{{'}}employee_name{{'}}'}}, ...</p>"
          ></textarea>
          @if (form.controls.body.invalid && form.controls.body.touched) {
            <mat-error>Body is required.</mat-error>
          }
        </mat-form-field>

        <!-- Variable hints -->
        <div class="var-hints">
          <p class="var-hint-label">Available variables (click to insert):</p>
          <div class="chip-group">
            @for (v of availableVars(); track v) {
              <span
                class="var-chip"
                (click)="insertVariable(v)"
                (keydown.enter)="insertVariable(v)"
                role="button"
                tabindex="0"
                [matTooltip]="'Click to copy ' + v"
              >{{ v }}</span>
            }
          </div>
        </div>

        <!-- Active toggle -->
        <mat-slide-toggle formControlName="isActive">Active</mat-slide-toggle>

      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button
        mat-flat-button
        [disabled]="form.invalid"
        (click)="submit()"
      >
        <mat-icon>save</mat-icon>
        {{ isEdit() ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .template-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    mat-form-field { width: 100%; }
    .body-field textarea { font-family: monospace; font-size: 12px; }
    .var-hints { margin: 0; }
    .var-hint-label { margin: 0 0 6px; font-size: 12px; color: #64748b; font-weight: 600; }
    .chip-group { display: flex; flex-wrap: wrap; gap: 6px; }
    .var-chip {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 12px;
      background: #f1f5f9;
      color: #0f172a;
      font-size: 11px;
      font-family: monospace;
      cursor: pointer;
      border: 1px solid #e2e8f0;
      transition: background 0.15s;
    }
    .var-chip:hover { background: #e2e8f0; }
  `],
})
export class TemplateDialog {
  private readonly fb       = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<TemplateDialog>);
  readonly data             = inject<TemplateDialogData>(MAT_DIALOG_DATA);

  readonly isEdit = signal(!!this.data?.template);

  readonly typeOptions = (Object.keys(TEMPLATE_TYPE_LABELS) as TemplateType[]).map(v => ({
    value: v,
    label: TEMPLATE_TYPE_LABELS[v],
  }));

  readonly form = this.fb.group({
    name        : this.fb.nonNullable.control(this.data?.template?.name ?? '', Validators.required),
    templateType: this.fb.nonNullable.control<TemplateType>(
      this.data?.template?.templateType ?? 'PAYSLIP',
      Validators.required,
    ),
    emailConfigId: this.fb.control<number | null>(this.data?.template?.emailConfigId ?? null),
    subject     : this.fb.nonNullable.control(this.data?.template?.subject ?? '', Validators.required),
    body        : this.fb.nonNullable.control(this.data?.template?.body ?? '', Validators.required),
    isActive    : this.fb.nonNullable.control(this.data?.template?.isActive ?? true),
  });

  get availableVars(): ReturnType<typeof signal<string[]>> {
    const type = this.form.controls.templateType.value as TemplateType;
    return signal([...TEMPLATE_VARIABLES['COMMON'], ...(TEMPLATE_VARIABLES[type] ?? [])]);
  }

  insertVariable(v: string): void {
    const ctrl = this.form.controls.body;
    ctrl.setValue(ctrl.value + v);
    ctrl.markAsDirty();
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.dialogRef.close(this.form.getRawValue());
  }
}
