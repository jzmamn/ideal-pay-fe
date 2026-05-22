import { Signal } from '@angular/core';

export type ComponentType =
  | 'FIXED_ALLOWANCE' | 'VARIABLE_ALLOWANCE' | 'OVERTIME'
  | 'BONUS' | 'INCREMENT' | 'GRATUITY'
  | 'FIXED_DEDUCTION' | 'VARIABLE_DEDUCTION' | 'LOP'
  | 'LOAN_EMI' | 'TAX' | 'DECREMENT';

export interface PayrollEntryRow {
  id              : number;
  employeeId      : number;
  empCode         : string;
  fullName        : string;
  department      : string;
  designation     : string;
  basicPay        : number;
  grossPay        : number;
  totalDeductions : number;
  netPay          : number;
  overrides       : PayrollOverride[];
}

export interface PayrollOverride {
  id            : number;
  entryId       : number;
  componentType : ComponentType;
  componentId   : number;
  amount        : number;
  remarks       : string | null;
}

export interface AllowanceType {
  id       : number;
  code     : string;
  name     : string;
  category : 'FIXED' | 'VARIABLE';
  isTaxable: boolean;
}

export interface DeductionType {
  id         : number;
  code       : string;
  name       : string;
  category   : 'FIXED' | 'VARIABLE';
  isStatutory: boolean;
}

export interface LoanRecord {
  loanId      : number;
  employeeId  : number;
  purpose     : string;
  principal   : number;
  outstanding : number;
  monthlyEmi  : number;
  status      : 'ACTIVE' | 'CLOSED';
}

export interface TaxSummaryRow {
  employeeId           : number;
  regime               : 'OLD' | 'NEW';
  projectedAnnualIncome: number;
  taxableIncome        : number;
  annualTax            : number;
  taxDeductedYtd       : number;
  tdsThisMonth         : number;
  surchargeAndCess     : number;
}

export type GridColumnType =
  | 'display' | 'number' | 'dropdown' | 'date'
  | 'toggle' | 'computed' | 'badge' | 'checkbox';

export interface GridColumnDef {
  field     : string;
  header    : string;
  type      : GridColumnType;
  width?    : string;
  editable? : boolean | ((row: PayrollEntryRow) => boolean);
  options?  : Signal<{ value: unknown; label: string }[]>;
  formatter?: (value: unknown, row: PayrollEntryRow) => string;
  validator?: (value: unknown, row: PayrollEntryRow) => string | null;
}

export interface ApiEnvelope<T> {
  success  : boolean;
  data     : T;
  message  : string;
  timestamp: string;
}
