export interface EmployeeRequest {
  employeeNo: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  nic?: string;
  isActive: boolean;
  remarks?: string;
  payrollName: string;
  epfNo?: string;
  etfNo?: string;
  basicSalary?: number;
  joinedDate: string;
  employeeTypeId: number;
  contractFrom?: string;
  contractTo?: string;
  nopayDaysId: number;
  jobCategoryId: number;
  designationId: number;
  branchId: number;
  gradeId: number;
  bankId?: number;
  bankBranchId?: number;
  accountNo?: string;
  statusId: number;
  statDate?: string;
  statFrom?: string;
  statTo?: string;
  phone?: string;
  email?: string;
  adrsLine1?: string;
  adrsLine2?: string;
  city?: string;
  districtId?: number;
  countryId: number;
  contactPerson?: string;
  cpAddress?: string;
  cpContactNumber?: string;
  createdBy: number;
  modifiedBy: number;
}

export interface EmployeeResponse {
  id: number;
  employeeNo: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  nic?: string;
  isActive: boolean;
  remarks?: string;
  payrollName: string;
  epfNo?: string;
  etfNo?: string;
  basicSalary?: number;
  joinedDate: string;

  employeeTypeId: number;
  employeeTypeCode: string;
  employeeTypeName: string;

  contractFrom?: string;
  contractTo?: string;

  nopayDaysId: number;
  nopayDaysCode: string;
  nopayDaysName: string;

  jobCategoryId: number;
  jobCategoryCode: string;
  jobCategoryName: string;

  designationId: number;
  designationCode: string;
  designationName: string;

  branchId: number;
  branchCode: string;
  branchName: string;

  gradeId: number;
  gradeCode: string;
  gradeName: string;

  bankId?: number;
  bankCode?: string;
  bankName?: string;
  bankBranchId?: number;
  bankBranchCode?: string;
  bankBranchName?: string;
  accountNo?: string;

  statusId: number;
  statusCode: string;
  statusName: string;

  statDate?: string;
  statFrom?: string;
  statTo?: string;

  phone?: string;
  email?: string;
  adrsLine1?: string;
  adrsLine2?: string;
  city?: string;
  districtId?: number;
  districtName?: string;

  countryId: number;
  countryName: string;

  contactPerson?: string;
  cpAddress?: string;
  cpContactNumber?: string;

  createdById: number;
  createdByCode: string;
  createdByUserName: string;
  createdDate: string;

  modifiedById: number;
  modifiedByCode: string;
  modifiedByUserName: string;
  modifiedDate: string;
}
