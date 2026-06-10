export type GratuityStatus = 'DRAFT' | 'APPROVED' | 'PAID' | 'CANCELLED';

export interface GratuityResponse {
  id: number;
  code: string;
  empId: number;
  empCode: string;
  empName: string;
  designationName: string;
  branchName: string;
  terminationDate: string;
  joinedDate: string;
  yearsOfService: number;
  basicSalary: number;
  gratuityAmount: number;
  status: GratuityStatus;
  remarks: string;
  createdDate: string;
  modifiedDate: string;
}

export interface GratuityRequest {
  empId: number;
  terminationDate: string;
  joinedDate: string;
  yearsOfService: number;
  basicSalary: number;
  gratuityAmount: number;
  remarks: string;
  createdBy: number;
  modifiedBy: number;
}
