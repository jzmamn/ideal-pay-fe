export interface EmployeeModel {
  id: number;
  employeeNo: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nic: string;
  payrollName: string;
  email: string;
  phone: string;
  joinedDate: string;
  isActive: boolean;
  notes: string;
  epfNo: string;
  etfNo: string;
  employeeTypeId: number | null;
  noPayDaysId: number | null;
  jobCategoryId: number | null;
  designationId: number | null;
  branchId: number | null;
  gradeId: number | null;
  adrsLine1: string;
  adrsLine2: string;
  city: string;
  district: string;
  country: string;
  contactPerson: string;
  cpAddress: string;
  cpContactNumber: string;
  cpEmail: string;
  basicSalary: number;
  remarks: string;
  createdBy: string;
  createdDate: string;
  modifiedBy: string;
  modifiedDate: string;
}

export function emptyEmployee(): EmployeeModel {
  return {
    id: 0,
    employeeNo: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    nic: '',
    payrollName: '',
    email: '',
    phone: '',
    joinedDate: '',
    isActive: true,
    notes: '',
    epfNo: '',
    etfNo: '',
    employeeTypeId: null,
    noPayDaysId: null,
    jobCategoryId: null,
    designationId: null,
    branchId: null,
    gradeId: null,
    adrsLine1: '',
    adrsLine2: '',
    city: '',
    district: '',
    country: 'LK',
    contactPerson: '',
    cpAddress: '',
    cpContactNumber: '',
    cpEmail: '',
    basicSalary: 0,
    remarks: '',
    createdBy: '',
    createdDate: '',
    modifiedBy: '',
    modifiedDate: '',
  };
}
