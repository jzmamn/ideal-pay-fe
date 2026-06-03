export type IncrementType   = 'BATCH' | 'INDIVIDUAL';
export type IncrementStatus = 'DRAFT' | 'APPROVED' | 'EXPORTED' | 'POSTED' | 'CANCELLED';

export interface SalaryIncrementFaResponse {
  id: number;
  faId: number;
  faCode: string;
  faName: string;
  currentAmount: number;
  incrementAmount: number;
  newAmount: number;
}

export interface SalaryIncrementDetailResponse {
  id: number;
  incrementId: number;
  empId: number;
  empCode: string;
  empName: string;
  designationName: string;
  branchName: string;
  currentBasic: number;
  incrementBasic: number;
  newBasic: number;
  isExported: boolean;
  exportedDate: string | null;
  remarks: string;
  faIncrements: SalaryIncrementFaResponse[];
}

export interface SalaryIncrementResponse {
  id: number;
  code: string;
  name: string;
  type: IncrementType;
  effectiveMonth: string;
  status: IncrementStatus;
  remarks: string;
  details: SalaryIncrementDetailResponse[];
  createdDate: string;
  modifiedDate: string;
}

// ── Request shapes ────────────────────────────────────────────────────────────

export interface SalaryIncrementFaRequest {
  faId: number;
  currentAmount: number;
  incrementAmount: number;
  newAmount: number;
  createdBy: number;
  modifiedBy: number;
}

export interface SalaryIncrementDetailRequest {
  empId: number;
  currentBasic: number;
  incrementBasic: number;
  newBasic: number;
  remarks: string;
  createdBy: number;
  modifiedBy: number;
  faIncrements: SalaryIncrementFaRequest[];
}

export interface SalaryIncrementRequest {
  code: string;
  name: string;
  type: IncrementType;
  effectiveMonth: string;
  remarks: string;
  createdBy: number;
  modifiedBy: number;
  details: SalaryIncrementDetailRequest[];
}
