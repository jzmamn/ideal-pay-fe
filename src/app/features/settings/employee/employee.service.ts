import { Injectable, signal } from '@angular/core';
import { EmployeeModel } from './employee.model';

const MOCK_EMPLOYEES: EmployeeModel[] = [
  {
    id: 1, employeeNo: 'EMP001', firstName: 'Alice', lastName: 'Johnson',
    dateOfBirth: '1990-05-12', nic: '901234567V',
    payrollName: '', email: 'alice.johnson@idealpay.com', phone: '+1-555-0101',
    joinedDate: '2020-03-15', isActive: true, notes: '',
    epfNo: 'EPF1001001', etfNo: 'ETF1001001',
    employeeTypeId: 2, noPayDaysId: null,
    jobCategoryId: 2, designationId: 1, branchId: 1, gradeId: 2,
    adrsLine1: '', adrsLine2: '', city: 'Colombo', district: 'Colombo', country: 'LK',
    contactPerson: '', cpAddress: '', cpContactNumber: '', cpEmail: '',
    basicSalary: 50000, remarks: '', createdBy: '', createdDate: '', modifiedBy: '', modifiedDate: '',
  },
  {
    id: 2, employeeNo: 'EMP002', firstName: 'Bob', lastName: 'Smith',
    dateOfBirth: '1985-11-23', nic: '851234568V',
    payrollName: '', email: 'bob.smith@idealpay.com', phone: '+1-555-0102',
    joinedDate: '2019-07-01', isActive: true, notes: '',
    epfNo: 'EPF1001002', etfNo: 'ETF1001002',
    employeeTypeId: 2, noPayDaysId: null,
    jobCategoryId: 1, designationId: 2, branchId: 1, gradeId: 1,
    adrsLine1: '', adrsLine2: '', city: 'Colombo', district: 'Colombo', country: 'LK',
    contactPerson: '', cpAddress: '', cpContactNumber: '', cpEmail: '',
    basicSalary: 65000, remarks: '', createdBy: '', createdDate: '', modifiedBy: '', modifiedDate: '',
  },
  {
    id: 3, employeeNo: 'EMP003', firstName: 'Carol', lastName: 'Williams',
    dateOfBirth: '1992-03-07', nic: '921234569V',
    payrollName: '', email: 'carol.w@idealpay.com', phone: '+1-555-0103',
    joinedDate: '2021-01-10', isActive: true, notes: '',
    epfNo: 'EPF1001003', etfNo: 'ETF1001003',
    employeeTypeId: 2, noPayDaysId: null,
    jobCategoryId: 3, designationId: 3, branchId: 1, gradeId: 2,
    adrsLine1: '', adrsLine2: '', city: 'Kandy', district: 'Kandy', country: 'LK',
    contactPerson: '', cpAddress: '', cpContactNumber: '', cpEmail: '',
    basicSalary: 42000, remarks: '', createdBy: '', createdDate: '', modifiedBy: '', modifiedDate: '',
  },
  {
    id: 4, employeeNo: 'EMP004', firstName: 'David', lastName: 'Brown',
    dateOfBirth: '1988-08-15', nic: '881234560V',
    payrollName: '', email: 'david.b@idealpay.com', phone: '+1-555-0104',
    joinedDate: '2022-06-20', isActive: true, notes: '',
    epfNo: 'EPF1001004', etfNo: 'ETF1001004',
    employeeTypeId: 3, noPayDaysId: null,
    jobCategoryId: 4, designationId: 4, branchId: 2, gradeId: 3,
    adrsLine1: '', adrsLine2: '', city: 'Galle', district: 'Galle', country: 'LK',
    contactPerson: '', cpAddress: '', cpContactNumber: '', cpEmail: '',
    basicSalary: 80000, remarks: '', createdBy: '', createdDate: '', modifiedBy: '', modifiedDate: '',
  },
  {
    id: 5, employeeNo: 'EMP005', firstName: 'Eva', lastName: 'Martinez',
    dateOfBirth: '1995-01-30', nic: '951234561V',
    payrollName: '', email: 'eva.m@idealpay.com', phone: '+1-555-0105',
    joinedDate: '2018-11-05', isActive: true, notes: '',
    epfNo: 'EPF1001005', etfNo: 'ETF1001005',
    employeeTypeId: 2, noPayDaysId: null,
    jobCategoryId: 4, designationId: 1, branchId: 1, gradeId: 2,
    adrsLine1: '', adrsLine2: '', city: 'Colombo', district: 'Colombo', country: 'LK',
    contactPerson: '', cpAddress: '', cpContactNumber: '', cpEmail: '',
    basicSalary: 55000, remarks: '', createdBy: '', createdDate: '', modifiedBy: '', modifiedDate: '',
  },
  {
    id: 6, employeeNo: 'EMP006', firstName: 'Frank', lastName: 'Davis',
    dateOfBirth: '1983-06-18', nic: '831234562V',
    payrollName: '', email: 'frank.d@idealpay.com', phone: '+1-555-0106',
    joinedDate: '2020-09-14', isActive: false, notes: '',
    epfNo: 'EPF1001006', etfNo: 'ETF1001006',
    employeeTypeId: 2, noPayDaysId: null,
    jobCategoryId: 5, designationId: 1, branchId: 3, gradeId: 2,
    adrsLine1: '', adrsLine2: '', city: 'Kandy', district: 'Kandy', country: 'LK',
    contactPerson: '', cpAddress: '', cpContactNumber: '', cpEmail: '',
    basicSalary: 72000, remarks: '', createdBy: '', createdDate: '', modifiedBy: '', modifiedDate: '',
  },
  {
    id: 7, employeeNo: 'EMP007', firstName: 'Grace', lastName: 'Wilson',
    dateOfBirth: '1997-09-04', nic: '971234563V',
    payrollName: '', email: 'grace.w@idealpay.com', phone: '+1-555-0107',
    joinedDate: '2021-04-28', isActive: true, notes: '',
    epfNo: 'EPF1001007', etfNo: 'ETF1001007',
    employeeTypeId: 2, noPayDaysId: null,
    jobCategoryId: 3, designationId: 5, branchId: 1, gradeId: 3,
    adrsLine1: '', adrsLine2: '', city: 'Colombo', district: 'Colombo', country: 'LK',
    contactPerson: '', cpAddress: '', cpContactNumber: '', cpEmail: '',
    basicSalary: 39000, remarks: '', createdBy: '', createdDate: '', modifiedBy: '', modifiedDate: '',
  },
  {
    id: 8, employeeNo: 'EMP008', firstName: 'Henry', lastName: 'Taylor',
    dateOfBirth: '1991-12-22', nic: '911234564V',
    payrollName: '', email: 'henry.t@idealpay.com', phone: '+1-555-0108',
    joinedDate: '2023-02-13', isActive: true, notes: '',
    epfNo: 'EPF1001008', etfNo: 'ETF1001008',
    employeeTypeId: 2, noPayDaysId: null,
    jobCategoryId: 1, designationId: 2, branchId: 1, gradeId: 1,
    adrsLine1: '', adrsLine2: '', city: 'Colombo', district: 'Colombo', country: 'LK',
    contactPerson: '', cpAddress: '', cpContactNumber: '', cpEmail: '',
    basicSalary: 90000, remarks: '', createdBy: '', createdDate: '', modifiedBy: '', modifiedDate: '',
  },
];

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly _employees = signal<EmployeeModel[]>(MOCK_EMPLOYEES);
  private readonly _selected = signal<EmployeeModel | null>(null);

  readonly employees = this._employees.asReadonly();
  readonly selected = this._selected.asReadonly();

  select(emp: EmployeeModel): void {
    this._selected.set(emp);
  }

  clearSelection(): void {
    this._selected.set(null);
  }

  add(emp: EmployeeModel): void {
    this._employees.update(list => [...list, emp]);
    this._selected.set(emp);
  }

  update(updated: EmployeeModel): void {
    this._employees.update(list => list.map(e => e.id === updated.id ? updated : e));
    this._selected.set(updated);
  }
}
