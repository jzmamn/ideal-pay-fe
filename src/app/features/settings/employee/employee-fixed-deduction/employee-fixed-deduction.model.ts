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

export interface EmployeeFixedDeductionResponse {
  id: number;
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
