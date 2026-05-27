export class OvertimeModel {
  id: number;
  code: string;
  name: string;
  description: string | undefined;
  isActive: boolean;
  formula: string | undefined;
  formulaEnabled: boolean;

  constructor(
    id: number,
    code: string,
    name: string,
    description: string | undefined,
    isActive: boolean,
    formula: string | undefined,
    formulaEnabled: boolean,
  ) {
    this.id             = id;
    this.code           = code;
    this.name           = name;
    this.description    = description;
    this.isActive       = isActive;
    this.formula        = formula;
    this.formulaEnabled = formulaEnabled;
  }
}
