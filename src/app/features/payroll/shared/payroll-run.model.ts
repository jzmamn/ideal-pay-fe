export type PayrollRunStatus = 'DRAFT' | 'LOCKED' | 'CORRECTION_DRAFT' | 'CORRECTION_LOCKED';
export type RunType          = 'NORMAL' | 'CORRECTION';

export interface PayrollRunDetailResponse {
  id:                  number;
  componentType:       string;
  componentId:         number | null;
  componentCode:       string;
  componentName:       string;
  amount:              number;
  hours:               number | null;
  days:                number | null;
}

export interface PayrollRunResponse {
  id:               number;
  payrollMonth:     string;
  status:           PayrollRunStatus;
  runType:          RunType;
  parentRunId:      number | null;

  empId:            number;
  empCode:          string;
  empName:          string;

  basicSalary:      number;
  totalAllowances:  number;
  totalDeductions:  number;
  grossPay:         number;
  netPay:           number;

  // Statutory
  epfLiableBase:    number;
  employeeEpf:      number;
  employerEpf:      number;
  etf:              number;
  payeTax:          number;
  workingDays:      number;

  processedDate:        string | null;
  processedByUserName:  string | null;

  details:          PayrollRunDetailResponse[];
}

export interface PayrollRunSummary {
  id:               number;
  payrollMonth:     string;
  status:           PayrollRunStatus;
  runType:          RunType;
  parentRunId:      number | null;
  empId:            number;
  empCode:          string;
  empName:          string;
  basicSalary:      number;
  totalAllowances:  number;
  totalDeductions:  number;
  grossPay:         number;
  netPay:           number;
  epfLiableBase:    number;
  employeeEpf:      number;
  employerEpf:      number;
  etf:              number;
  payeTax:          number;
  workingDays:           number;
  salaryAdvanceAmount:   number;
  processedDate:         string | null;
  processedByUserName:   string | null;
}
