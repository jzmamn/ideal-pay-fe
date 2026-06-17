export interface EmployeeFixedDeductionRequest {
  id?: number;
  empId: number;
  fdId: number;
  amount: number;
  payrollMonth: string;
  isProcessed?: boolean;
  processedDate?: string;
  // createdBy / modifiedBy are resolved server-side from the logged-in user
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
  // createdBy / modifiedBy are resolved server-side from the logged-in user
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

/**
 * Result of evaluating a Fixed Deduction's formula for one employee (zero when no formula is
 * configured — Fixed Deductions have no static fallback amount). Returned by the
 * "preview-amount" endpoint, called the instant a checkbox is checked in the
 * Employee → Salary Tab → Fixed Deduction grid.
 */
export interface EmployeeFixedDeductionPreviewResult {
  expression: string;
  /** The computed amount. Null when evaluation failed (see technicalError/userFriendlyError). */
  result: number | null;
  context: Record<string, unknown>;
  technicalError?: string;
  userFriendlyError?: string;
}
