import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Employee } from '../../services/payroll-data.service';

@Component({
  selector: 'app-employee-detail-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, CurrencyPipe],
  templateUrl: './employee-detail-modal.component.html',
  styleUrl: './employee-detail-modal.component.scss',
})
export class EmployeeDetailModalComponent {
  emp = inject<Employee>(MAT_DIALOG_DATA);
}
