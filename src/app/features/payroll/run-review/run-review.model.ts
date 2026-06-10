export type RunStatus = 'DRAFT' | 'LOCKED' | 'CORRECTION_DRAFT' | 'CORRECTION_LOCKED';

export interface RunReviewRow {
  empId:         string;
  empName:       string;
  componentType: string;
  componentCode: string;
  componentName: string;
  /** 'Y' when a formula was configured on the component master */
  hasFormula:    'Y' | 'N';
  /** The formula expression string; null when hasFormula = 'N' */
  formulaExpr:   string | null;
  beforeValue:   number;
  afterValue:    number;
  difference:    number;
  runStatus:     RunStatus;
}
