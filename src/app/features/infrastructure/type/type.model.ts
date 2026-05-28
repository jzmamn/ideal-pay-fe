export interface TypeRequest {
  name: string;
  description: string;
  isActive: boolean;
  isDateRange: boolean;
  createdBy: number;
  modifiedBy: number;
}

export interface TypeResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  isDateRange: boolean;
  createdById: number;
  createdByCode: string;
  createdByUserName: string;
  createdDate: string;
  modifiedById: number;
  modifiedByCode: string;
  modifiedByUserName: string;
  modifiedDate: string;
}
