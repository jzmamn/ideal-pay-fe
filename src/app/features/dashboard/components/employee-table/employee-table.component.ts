import { ChangeDetectionStrategy, Component, OnInit, inject, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PayrollDataService, Employee } from '../../services/payroll-data.service';

@Component({
  selector: 'app-employee-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTableModule, MatButtonModule, MatIconModule, CurrencyPipe],
  templateUrl: './employee-table.component.html',
  styleUrl: './employee-table.component.scss',
})
export class EmployeeTableComponent implements OnInit {
  private dataService = inject(PayrollDataService);

  viewClick = output<Employee>();

  employees = signal<Employee[]>([]);

  displayedColumns = ['name', 'dept', 'role', 'base', 'ytdBonus', 'status', 'actions'];

  ngOnInit(): void {
    this.dataService.getEmployees().subscribe(emps => this.employees.set(emps));
  }

  openEmployee(emp: Employee): void {
    this.viewClick.emit(emp);
  }
}
