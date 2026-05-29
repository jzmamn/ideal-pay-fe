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
  location?: string;
}

export interface Grade extends MasterEntity {
  amount?: number;
  description?: string;
}

export interface Department extends MasterEntity {}

export interface Designation extends MasterEntity {}

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
