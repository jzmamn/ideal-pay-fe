export interface EmployeeBonusRequest {
  id?: number;
  empId: number;
  bonusId: number;
  amount: number;
  payrollMonth: string;
  isProcessed?: boolean;
  processedDate?: string;
  createdBy: number;
  modifiedBy: number;
}

export interface EmployeeBonusResponse {
  id: number;
  amount: number;
  payrollMonth: string;
  isProcessed: boolean;
  processedDate?: string;

  empId: number;
  empCode: string;
  empName: string;

  bonusId: number;
  bonusCode: string;
  bonusName: string;
  bonusAmount: number;
  formulaEnabled: boolean;

  createdById: number;
  createdByCode: string;
  createdByUserName: string;
  createdDate: string;
  modifiedById: number;
  modifiedByCode: string;
  modifiedByUserName: string;
  modifiedDate: string;
}
