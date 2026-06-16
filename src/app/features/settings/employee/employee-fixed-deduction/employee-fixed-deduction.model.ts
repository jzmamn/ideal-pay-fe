export interface EmployeeFixedDeductionRequest {
  id?: number;
  empId: number;
  fdId: number;
  amount: number;
  payrollMonth: string;
  isProcessed?: boolean;
  processedDate?: string;
  createdBy: number;
  modifiedBy: number;
}

/** One row in the Employee → Salary Tab → Fixed Deduction checkbox grid selection payload. */
export interface EmployeeFixedDeductionSelection {
  fdId: number;
  amount: number;
}

/**
 * Replaces the employee's Fixed Deduction assignments for a single payroll month with exactly
 * the deductions listed in `selections`. Deductions previously assigned but omitted here are
 * removed by the server.
 */
export interface EmployeeFixedDeductionAssignRequest {
  payrollMonth: string;
  createdBy: number;
  modifiedBy: number;
  selections: EmployeeFixedDeductionSelection[];
}

export interface EmployeeFixedDeductionResponse {
  id: number;
  /** True when this Fixed Deduction is currently assigned to the employee for the given month. */
  isAssigned: boolean;
  amount: number;
  payrollMonth: string;
  isProcessed: boolean;
  processedDate?: string;

  empId: number;
  empCode: string;
  empName: string;

  fdId: number;
  fdCode: string;
  fdName: string;
  /**
   * True when the stored amount was produced by evaluating the deduction formula at load time.
   * Formula-calculated records cannot be edited manually. Changes require updating the
   * deduction definition and re-running the load.
   */
  formulaCalculated: boolean;

  createdById: number;
  createdByCode: string;
  createdByUserName: string;
  createdDate: string;
  modifiedById: number;
  modifiedByCode: string;
  modifiedByUserName: string;
  modifiedDate: string;
}
