export interface SystemSetup {
  id: number;
  code: string;
  name: string;
  value: string;
  description: string | null;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdById: number;
  createdDate: string;
  modifiedById: number;
  modifiedDate: string;
}

export interface SystemSetupUpdate {
  value: string;
  isActive: boolean;
  modifiedBy: number;
}
