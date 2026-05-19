export interface FixedLineItem {
  name: string;
  amount: number;
}

export interface EmployeeSalaryModel {
  employeeId: number;
  basicSalary: number;
  fixedAllowances: FixedLineItem[];
  fixedDeductions: FixedLineItem[];
}

export function emptySalary(employeeId: number): EmployeeSalaryModel {
  return { employeeId, basicSalary: 0, fixedAllowances: [], fixedDeductions: [] };
}
