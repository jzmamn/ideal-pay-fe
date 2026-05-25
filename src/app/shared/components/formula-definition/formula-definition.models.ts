export type FormulaType = 'OVERTIME' | 'NO_PAY' | 'VARIABLE_ALLOWANCE' | 'VARIABLE_DEDUCTION';

export interface FormulaDefinitionFormValue {
  expression: string;
  isActive: boolean;
}


export interface FormulaDefinitionRequestDTO {
  formulaType?: FormulaType;
  expression: string;
  isActive: boolean;
  createdBy: number;
  modifiedBy: number;
}

export interface FormulaValidateResponseDTO {
  valid: boolean;
  result?: number | null;
  error?: string | null;
}
