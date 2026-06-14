export interface EmployeeOvertimeResponse {
  id: number;
  /** Rate per hour — computed at load phase from the OT type's formula. Read-only in UI. */
  rate: number;
  hours: number;
  /** amount = rate × hours, always server-derived. Read-only in UI. */
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

export interface EmployeeOvertimeRequest {
  empId: number;
  overtimeId: number;
  hours: number;
  payrollMonth: string;
  isProcessed?: boolean;
  processedDate?: string;
  createdBy: number;
  modifiedBy: number;
}
