import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { GroupModel } from './group.model';

@Component({
  selector: 'app-group-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatDividerModule,
  ],
  host: { class: 'mat-dialog-host' },
  templateUrl: './group-dialog.html',
  styleUrl: './groups.scss',
})
export class GroupDialog {
  readonly row = inject<GroupModel | null>(MAT_DIALOG_DATA);
  readonly isEdit = this.row != null;

  private readonly fb = inject(FormBuilder);

  readonly groupForm = this.fb.group({
    id:       [{ value: this.row?.id ?? null, disabled: true }],
    code:     [this.row?.code     ?? '', Validators.required],
    name:     [this.row?.name     ?? '', Validators.required],
    isActive: [this.row?.isActive ?? true],
  });
}
