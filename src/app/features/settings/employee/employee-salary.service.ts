import { Injectable, signal } from '@angular/core';
import { EmployeeSalaryModel, emptySalary } from './employee-salary.model';

interface EmpBsalDto {
  empId: number;
  basicSalary: number;
  fixedAllowance1: number;
  fixedAllowance2: number;
  fixedDeduction1: number;
  fixedDeduction2: number;
}

const MOCK_API_DATA: EmpBsalDto[] = [
  { empId: 1, basicSalary: 50000, fixedAllowance1: 1000, fixedAllowance2: 3000, fixedDeduction1: 200,  fixedDeduction2: 300 },
  { empId: 2, basicSalary: 65000, fixedAllowance1: 1500, fixedAllowance2: 3500, fixedDeduction1: 500,  fixedDeduction2: 400 },
  { empId: 3, basicSalary: 42000, fixedAllowance1: 800,  fixedAllowance2: 2500, fixedDeduction1: 150,  fixedDeduction2: 250 },
  { empId: 4, basicSalary: 80000, fixedAllowance1: 2000, fixedAllowance2: 5000, fixedDeduction1: 800,  fixedDeduction2: 600 },
  { empId: 5, basicSalary: 55000, fixedAllowance1: 1200, fixedAllowance2: 2800, fixedDeduction1: 300,  fixedDeduction2: 350 },
  { empId: 6, basicSalary: 72000, fixedAllowance1: 1800, fixedAllowance2: 4000, fixedDeduction1: 600,  fixedDeduction2: 500 },
  { empId: 7, basicSalary: 39000, fixedAllowance1: 700,  fixedAllowance2: 2000, fixedDeduction1: 100,  fixedDeduction2: 200 },
  { empId: 8, basicSalary: 90000, fixedAllowance1: 2500, fixedAllowance2: 6000, fixedDeduction1: 1000, fixedDeduction2: 900 },
];

function fromDto(dto: EmpBsalDto): EmployeeSalaryModel {
  return {
    employeeId: dto.empId,
    basicSalary: dto.basicSalary,
    fixedAllowances: [
      { name: 'Fixed Allowance 1', amount: dto.fixedAllowance1 },
      { name: 'Fixed Allowance 2', amount: dto.fixedAllowance2 },
    ],
    fixedDeductions: [
      { name: 'Fixed Deduction 1', amount: dto.fixedDeduction1 },
      { name: 'Fixed Deduction 2', amount: dto.fixedDeduction2 },
    ],
  };
}

@Injectable({ providedIn: 'root' })
export class EmployeeSalaryService {
  private readonly _salaries = signal<EmployeeSalaryModel[]>(MOCK_API_DATA.map(fromDto));

  getByEmployeeId(employeeId: number): EmployeeSalaryModel {
    return this._salaries().find(s => s.employeeId === employeeId) ?? emptySalary(employeeId);
  }

  save(salary: EmployeeSalaryModel): void {
    this._salaries.update(list => {
      const exists = list.some(s => s.employeeId === salary.employeeId);
      return exists
        ? list.map(s => s.employeeId === salary.employeeId ? salary : s)
        : [...list, salary];
    });
  }
}
