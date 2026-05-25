import { ChangeDetectionStrategy, Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Company } from '../../../shared/models/master-data.models';
import { CompanyService } from './company.service';
import { MasterDataService } from '../../../shared/services/master-data.service';

const PHONE_PATTERN = /^\+?[\d\s\-().]{7,20}$/;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

@Component({
  selector: 'app-company-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    ReactiveFormsModule,
    MatDividerModule,
  ],
  host: { class: 'mat-dialog-host' },
  templateUrl: './company-dialog.html',
  styleUrl: './company.scss',
})
export class CompanyDialog {
  readonly row    = inject<Company | null>(MAT_DIALOG_DATA);
  readonly isEdit = this.row != null;

  private readonly fb         = inject(FormBuilder);
  private readonly companySvc = inject(CompanyService);
  private readonly masterSvc  = inject(MasterDataService);
  private readonly dialogRef  = inject(MatDialogRef<CompanyDialog>);
  private readonly fileInputRef = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  readonly logoPreview  = signal<string | null>(this.row?.logo ?? null);
  readonly logoFileName = signal<string>('');
  readonly logoTypeError = signal(false);

  readonly companyForm = this.fb.group({
    id:            [{ value: this.row?.id ?? null, disabled: true }],
    code:          [{ value: this.row?.code ?? '', disabled: true }, Validators.required],
    name:          [this.row?.name          ?? '', Validators.required],
    contactPerson: [this.row?.contactPerson ?? '', Validators.required],
    isActive:      [this.row?.isActive ?? true],
    address: this.fb.group({
      line1: [this.row?.address?.line1  ?? '', Validators.required],
      line2: [this.row?.address?.line2  ?? ''],
      city:  [this.row?.address?.city   ?? '', Validators.required],
      email: [this.row?.address?.email  ?? '', Validators.email],
    }),
    telephone: [this.row?.telephone ?? '', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    fax:       [this.row?.fax  ?? ''],
    logo:      [this.row?.logo ?? ''],
  });

  get addressGroup() {
    return this.companyForm.controls.address;
  }

  save(): void {
    if (this.companyForm.invalid) { this.companyForm.markAllAsTouched(); return; }
    const v = this.companyForm.getRawValue();

    const dto: Omit<Company, 'id'> = {
      code:          v.code!,
      name:          v.name!,
      contactPerson: v.contactPerson!,
      isActive:      v.isActive!,
      address: {
        line1: v.address.line1!,
        line2: v.address.line2 || undefined,
        city:  v.address.city!,
        email: v.address.email || undefined,
      },
      telephone: v.telephone!,
      fax:       v.fax || undefined,
      logo:      v.logo || undefined,
    };

    const handlers = {
      next: () => { this.masterSvc.reload('companies'); this.dialogRef.close(true); },
      error: () => this.dialogRef.close(false),
    };

    if (this.isEdit) {
      this.companySvc.update(this.row!.id, { ...dto, id: this.row!.id }).subscribe(handlers);
    } else {
      this.companySvc.create(dto).subscribe(handlers);
    }
  }

  delete(): void {
    if (this.row?.id == null) return;
    this.companySvc.delete(this.row.id).subscribe({
      next: () => { this.masterSvc.reload('companies'); this.dialogRef.close(true); },
      error: () => this.dialogRef.close(false),
    });
  }

  browseFile(): void {
    this.fileInputRef()?.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      this.logoTypeError.set(true);
      this.logoFileName.set('');
      this.logoPreview.set(null);
      this.companyForm.controls.logo.setValue('');
      input.value = '';
      return;
    }

    this.logoTypeError.set(false);
    this.logoFileName.set(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.logoPreview.set(result);
      this.companyForm.controls.logo.setValue(result);
    };
    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.logoPreview.set(null);
    this.logoFileName.set('');
    this.logoTypeError.set(false);
    this.companyForm.controls.logo.setValue('');
    const fileInput = this.fileInputRef()?.nativeElement;
    if (fileInput) fileInput.value = '';
  }
}
