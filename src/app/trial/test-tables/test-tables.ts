import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatGridListModule } from '@angular/material/grid-list';
import { RouterLink, RouterOutlet } from '@angular/router';
import { LookupConfig } from '../../shared/components/lookup/lookup.config';
import { EmployeeTestForm } from '../test-forms/test-forms';
import { LookupComponent } from '../../shared/components/lookup/lookup.component';

@Component({
  selector: 'app-test-tables',
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
    MatGridListModule,
    LookupComponent
],
  templateUrl: './test-tables.html',
  styleUrl: './test-tables.scss',
})
export class TestTables {
    employeeForm: any;
  departments = ['HR', 'IT', 'Finance', 'Operations'];

  constructor(private fb: FormBuilder) {
    this.employeeForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      department: ['', Validators.required],
      joiningDate: ['', Validators.required],
      salary: ['', [Validators.required, Validators.min(0)]],
      isActive: [true]
    });
    
  }


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
  
  onSubmit() {
    if (this.employeeForm.valid) {
      console.log(this.employeeForm.value);
    } else {
      this.employeeForm.markAllAsTouched();
    }
  }

  reset() {
    this.employeeForm.reset({ isActive: true });
  }


}
