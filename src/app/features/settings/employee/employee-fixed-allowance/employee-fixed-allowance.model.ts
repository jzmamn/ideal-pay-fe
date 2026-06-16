export interface EmployeeFixedAllowanceRequest {
  id?: number;
  empId: number;
  faId: number;
  amount: number;
  payrollMonth: string;
  isProcessed?: boolean;
  processedDate?: string;
  createdBy: number;
  modifiedBy: number;
}

/** One row in the Employee → Salary Tab → Fixed Allowance checkbox grid selection payload. */
export interface EmployeeFixedAllowanceSelection {
  faId: number;
  amount: number;
}

/**
 * Replaces the employee's Fixed Allowance assignments for a single payroll month with exactly
 * the allowances listed in `selections`. Allowances previously assigned but omitted here are
 * removed by the server.
 */
export interface EmployeeFixedAllowanceAssignRequest {
  payrollMonth: string;
  createdBy: number;
  modifiedBy: number;
  selections: EmployeeFixedAllowanceSelection[];
}

export interface EmployeeFixedAllowanceResponse {
  id: number;
  /** True when this Fixed Allowance is currently assigned to the employee for the given month. */
  isAssigned: boolean;
  amount: number;
  payrollMonth: string;
  isProcessed: boolean;
  processedDate?: string;

  empId: number;
  empCode: string;
  empName: string;

  faId: number;
  faCode: string;
  faName: string;
  /** True when the amount was produced by MVEL formula evaluation at load time. Amount is read-only when true. */
  formulaCalculated: boolean;

  createdById: number;
  createdByCode: string;
  createdByUserName: string;
  createdDate: string;
  modifiedById: number;
  modifiedByCode: string;
  modifiedByUserName: string;
  modifiedDate: string;

  /** Set when the row was created via file import; null for manually entered rows. */
  importLogId: number | null;
}
