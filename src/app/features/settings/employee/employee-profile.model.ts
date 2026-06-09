export type { EmployeeResponse, EmployeeRequest } from './employee.model';
export type { EmployeeFixedAllowanceRequest, EmployeeFixedAllowanceResponse } from './employee-fixed-allowance/employee-fixed-allowance.model';
export type { EmployeeFixedDeductionRequest, EmployeeFixedDeductionResponse } from './employee-fixed-deduction/employee-fixed-deduction.model';

import type { EmployeeResponse } from './employee.model';
import type { EmployeeFixedAllowanceRequest, EmployeeFixedAllowanceResponse } from './employee-fixed-allowance/employee-fixed-allowance.model';
import type { EmployeeFixedDeductionRequest, EmployeeFixedDeductionResponse } from './employee-fixed-deduction/employee-fixed-deduction.model';

// ── Variable allowance ────────────────────────────────────────────────────────

export interface EmployeeVariableAllowanceRequest {
  id?: number;
  empId: number;
  vaId: number;
  amount: number;
  payrollMonth?: string;
  isProcessed?: boolean;
  processedDate?: string;
  createdBy: number;
  modifiedBy: number;
}

export interface EmployeeVariableAllowanceResponse {
  id: number;
  amount: number;
  payrollMonth: string;
  isProcessed: boolean;
  processedDate?: string;
  empId: number;
  empCode: string;
  empName: string;
  vaId: number;
  vaCode: string;
  vaName: string;
  createdById: number;
  createdByCode: string;
  createdByUserName: string;
  createdDate: string;
  modifiedById: number;
  modifiedByCode: string;
  modifiedByUserName: string;
  modifiedDate: string;
}

// ── Variable deduction ────────────────────────────────────────────────────────

export interface EmployeeVariableDeductionRequest {
  id?: number;
  empId: number;
  vdId: number;
  amount: number;
  payrollMonth?: string;
  isProcessed?: boolean;
  processedDate?: string;
  createdBy: number;
  modifiedBy: number;
}

export interface EmployeeVariableDeductionResponse {
  id: number;
  amount: number;
  payrollMonth: string;
  isProcessed: boolean;
  processedDate?: string;
  empId: number;
  empCode: string;
  empName: string;
  vdId: number;
  vdCode: string;
  vdName: string;
  createdById: number;
  createdByCode: string;
  createdByUserName: string;
  createdDate: string;
  modifiedById: number;
  modifiedByCode: string;
  modifiedByUserName: string;
  modifiedDate: string;
}

// ── Nopay ─────────────────────────────────────────────────────────────────────

export interface EmployeeNopayRequest {
  id?: number;
  empId: number;
  nopayId: number;
  days: number;
  amount: number;
  payrollMonth?: string;
  isProcessed?: boolean;
  processedDate?: string;
  createdBy: number;
  modifiedBy: number;
}

export interface EmployeeNopayResponse {
  id: number;
  days: number;
  amount: number;
  payrollMonth: string;
  isProcessed: boolean;
  processedDate?: string;
  empId: number;
  empCode: string;
  empName: string;
  nopayId: number;
  nopayCode: string;
  nopayName: string;
  createdById: number;
  createdByCode: string;
  createdByUserName: string;
  createdDate: string;
  modifiedById: number;
  modifiedByCode: string;
  modifiedByUserName: string;
  modifiedDate: string;
}

// ── Overtime ──────────────────────────────────────────────────────────────────

export interface EmployeeOvertimeRequest {
  id?: number;
  empId: number;
  overtimeId: number;
  hours: number;
  amount: number;
  payrollMonth?: string;
  isProcessed?: boolean;
  processedDate?: string;
  createdBy: number;
  modifiedBy: number;
}

export interface EmployeeOvertimeResponse {
  id: number;
  hours: number;
  amount: number;
  payrollMonth: string;
  isProcessed: boolean;
  processedDate?: string;
  empId: number;
  empCode: string;
  empName: string;
  overtimeId: number;
  overtimeCode: string;
  overtimeName: string;
  createdById: number;
  createdByCode: string;
  createdByUserName: string;
  createdDate: string;
  modifiedById: number;
  modifiedByCode: string;
  modifiedByUserName: string;
  modifiedDate: string;
}

// ── Late ──────────────────────────────────────────────────────────────────────

export interface EmployeeLateResponse {
  id: number;
  hours: number;
  amount: number;
  payrollMonth: string;
  isProcessed: boolean;
  processedDate?: string;
  empId: number;
  empCode: string;
  empName: string;
}

export interface EmployeeLateRequest {
  id?: number;
  empId: number;
  hours: number;
  amount: number;
  payrollMonth?: string;
  isProcessed?: boolean;
  createdBy: number;
  modifiedBy: number;
}

// ── Profile ───────────────────────────────────────────────────────────────────

export interface EmployeePayrollComponentsResponse {
  employee: EmployeeResponse;
  fixedAllowances: EmployeeFixedAllowanceResponse[];
  fixedDeductions: EmployeeFixedDeductionResponse[];
  variableAllowances: EmployeeVariableAllowanceResponse[];
  variableDeductions: EmployeeVariableDeductionResponse[];
  nopays: EmployeeNopayResponse[];
  overtimes: EmployeeOvertimeResponse[];
}

export interface EmployeeProfileSaveRequest {
  fixedAllowances: EmployeeFixedAllowanceRequest[];
  fixedDeductions: EmployeeFixedDeductionRequest[];
  variableAllowances: EmployeeVariableAllowanceRequest[];
  variableDeductions: EmployeeVariableDeductionRequest[];
  nopays: EmployeeNopayRequest[];
  overtimes: EmployeeOvertimeRequest[];
}
