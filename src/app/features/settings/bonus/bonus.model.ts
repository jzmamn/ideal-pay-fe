export type BonusCalculationMethod = 'FIXED_AMOUNT' | 'FORMULA_BASED';

export class BonusModel {
  id: number;
  code: string;
  name: string;
  description: string | null;
  calculationMethod: BonusCalculationMethod;
  isActive: boolean;
  liableForEpf: boolean;
  liableForEtf: boolean;
  liableForPaye: boolean;
  liableNoPay: boolean;
  formula: string | undefined;
  formulaEnabled: boolean;

  constructor(
    id: number,
    code: string,
    name: string,
    description: string | null,
    calculationMethod: BonusCalculationMethod,
    isActive: boolean,
    liableForEpf: boolean,
    liableForEtf: boolean,
    liableForPaye: boolean,
    liableNoPay: boolean,
    formula: string | undefined = undefined,
    formulaEnabled = false,
  ) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.description = description;
    this.calculationMethod = calculationMethod;
    this.isActive = isActive;
    this.liableForEpf = liableForEpf;
    this.liableForEtf = liableForEtf;
    this.liableForPaye = liableForPaye;
    this.liableNoPay = liableNoPay;
    this.formula = formula;
    this.formulaEnabled = formulaEnabled;
  }
}
