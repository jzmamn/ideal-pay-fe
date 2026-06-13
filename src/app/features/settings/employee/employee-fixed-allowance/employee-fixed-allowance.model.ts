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

export interface EmployeeFixedAllowanceResponse {
  id: number;
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
  formulaEnabled: boolean;
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
