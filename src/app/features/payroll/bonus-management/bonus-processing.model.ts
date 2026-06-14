// ── Status ────────────────────────────────────────────────────────────────────
export type BonusStatus = 'PENDING' | 'APPROVED' | 'PROCESSED' | 'CANCELLED';
export type BonusCalculationMethod = 'FIXED_AMOUNT' | 'FORMULA_BASED';

// ── API shapes (matching BonusProcessingBatchResponseDTO) ─────────────────────
export interface BonusProcessingBatch {
  id: number;
  payrollMonth: string;
  status: BonusStatus;
  employeeCount: number;
  totalAmount: number;
  notes: string | null;

  bonusId: number;
  bonusCode: string;
  bonusName: string;
  calculationMethod: BonusCalculationMethod;
  formulaEnabled: boolean;
  formula: string | null;

  createdById: number | null;
  createdByUserName: string | null;
  createdDate: string | null;

  approvedById: number | null;
  approvedByUserName: string | null;
  approvedDate: string | null;

  processedById: number | null;
  processedByUserName: string | null;
  processedDate: string | null;

  modifiedById: number | null;
  modifiedByUserName: string | null;
  modifiedDate: string | null;

  entries?: BonusEntryRow[];
}

// ── API shapes (matching EmployeeBonusProcessingRowDTO) ───────────────────────
export interface BonusEntryRow {
  id: number;
  empId: number;
  empCode: string;
  empName: string;
  departmentName: string | null;
  designationName: string | null;
  branchName: string | null;

  calculatedAmount: number;
  adjustedAmount: number | null;
  effectiveAmount: number;

  formulaExpression: string | null;
  formulaResult: number | null;

  status: BonusStatus;

  approvedById: number | null;
  approvedByUserName: string | null;
  approvedDate: string | null;

  note: string | null;
  createdDate: string | null;
  modifiedDate: string | null;

  // UI-only mutable field (not from API)
  _editAmount?: number | null;
  _editNote?: string;
  _dirty?: boolean;
}

// ── Calculate request (matching BonusProcessingCalculateRequestDTO) ───────────
export interface BonusCalculateRequest {
  bonusId: number;
  payrollMonth: string;
  employeeIds?: number[];
  departmentId?: number | null;
  branchId?: number | null;
  designationId?: number | null;
  gradeId?: number | null;
  employeeTypeId?: number | null;
  fixedAmount?: number | null;
  formulaContext?: Record<string, unknown>;
  employeeFormulaContexts?: Record<number, Record<string, unknown>>;
  notes?: string | null;
  createdBy: number;
  modifiedBy: number;
}

// ── Reports ───────────────────────────────────────────────────────────────────
export interface BonusSummaryReport {
  bonusCode: string;
  bonusName: string;
  payrollMonth: string;
  status: string;
  employeeCount: number;
  totalAmount: number;
}

export interface BonusDepartmentReport {
  departmentName: string;
  bonusName: string;
  payrollMonth: string;
  employeeCount: number;
  totalAmount: number;
}

export interface BonusApprovalReport {
  batchId: number;
  bonusCode: string;
  bonusName: string;
  payrollMonth: string;
  status: string;
  employeeCount: number;
  totalAmount: number;
  approvedByUserName: string | null;
  approvedDate: string | null;
  createdByUserName: string | null;
  createdDate: string | null;
}
