export interface MasterEntity {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

export interface Country extends MasterEntity {}

export interface JobCategory extends MasterEntity {
  description?: string;
}

export interface Branch extends MasterEntity {
  description?: string;
  location?: string;
}

export interface Bank extends MasterEntity {}

export interface BankBranch extends MasterEntity {
  bankId: number;
}

export interface Grade extends MasterEntity {
  amount?: number;
  description?: string;
}

export interface Department extends MasterEntity {
  description?: string;
}

export interface Designation extends MasterEntity {
  description?: string;
}

export interface District extends MasterEntity {}

export interface EmployeeType extends MasterEntity {
  description?: string;
  dateRange: boolean;
}

export interface EmployeeStatus extends MasterEntity {
  dateOnly: boolean;
}

export interface NoPayDays extends MasterEntity {
  days: number;
  description?: string;
  liableNoPay?: boolean;
  formula?: string;
}

export interface Company extends MasterEntity {
  contactPerson: string;
  address: {
    line1:  string;
    line2?: string;
    city:   string;
    email?: string;
  };
  telephone: string;
  fax?:      string;
  email?:    string;
  logo?:     string;
}
