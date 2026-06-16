export interface TypeRequest {
  name: string;
  description: string;
  isActive: boolean;
  endDate: boolean;
}

export interface TypeResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  endDate: boolean;
  createdById: number;
  createdByCode: string;
  createdByUserName: string;
  createdDate: string;
  modifiedById: number;
  modifiedByCode: string;
  modifiedByUserName: string;
  modifiedDate: string;
}
