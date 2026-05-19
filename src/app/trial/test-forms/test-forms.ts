import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { LookupComponent } from '../../shared/components/lookup/lookup.component';
import { LookupConfig } from '../../shared/components/lookup/lookup.config';
import { LookupDataService } from '../../shared/components/lookup/lookup-data.service';
import { TestFormService } from './test-form.service';


export interface EmployeeTestForm {
  id: number;
  name: string;
  department: string;
  salary: number;
}


@Component({
  selector: 'app-test-forms',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatCheckboxModule,
    MatCardModule,
    LookupComponent,
    MatGridListModule

  ],
  templateUrl: './test-forms.html',
  styleUrl: './test-forms.scss',
})
export class TestForms {

  // *** In REST API ***
  private employeeService = inject(TestFormService);
  employees = signal<EmployeeTestForm[]>([]);

  private fb = inject(FormBuilder);

  lookupConfig: LookupConfig<EmployeeTestForm> = {
    title: 'Employee Lookup',
    displayedColumns: ['id', 'name', 'department', 'salary'],
    columnLabels: {
      id: 'ID',
      name: 'Employee Name',
      department: 'Department',
      salary: 'Salary'
    },
    data: [
      { id: 1, name: 'Jezeem', department: 'IT', salary: 5000 },
      { id: 2, name: 'Aymen', department: 'IT', salary: 5000 },
      { id: 3, name: 'Zaid', department: 'IT', salary: 5000 },
      { id: 4, name: 'Raiyan', department: 'IT', salary: 5000 },
      { id: 5, name: 'Shaamil', department: 'IT', salary: 5000 },
      { id: 6, name: 'Amris', department: 'IT', salary: 5000 },
      { id: 7, name: 'Mariyam', department: 'HR', salary: 4500 }
    ]
  };




  /**
   * *** In REST API ***
   * 
   *   lookupConfig: LookupConfig<EmployeeTestForm> = {
    title: 'Employee Lookup',
    displayedColumns: ['id', 'name', 'department', 'salary'],
    columnLabels: {
      id: 'ID',
      name: 'Employee Name',
      department: 'Department',
      salary: 'Salary'
    },
    data:  this.employees(),   // <-- reactive, updates when signal changes
  };
   */

  

  //selected row from dialog
  row = inject(LookupDataService);
  selectedRow = computed(() => this.row.sharedMessage());

  employeeForm: FormGroup;
  departments = ['HR', 'IT', 'Finance', 'Operations'];

  constructor() {
    this.employeeForm = this.fb.group({
      employee: [null],
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      department: ['', Validators.required],
      joiningDate: ['', Validators.required],
      salary: ['', [Validators.required, Validators.min(0)]],
      isActive: [true]
    });

    //*** In REST API ***
    this.employeeService.getAll().subscribe({
      next: data => this.employees.set(data),
      error: err => console.error('Failed to load employees', err),
    });
  }

  onSelected(item: any) {
    console.log('Selected:', item);
  }

  submit() {
    if (this.employeeForm.valid) {
      console.log(this.employeeForm.value);
    } else {
      this.employeeForm.markAllAsTouched();
    }
  }

  reset() {
    this.employeeForm.reset({ isActive: true });
  }

  onEmployeeSelect(emp: any) {
    console.log('Selected Employee:', emp);
  }
}
