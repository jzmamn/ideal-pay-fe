import { DeductionType } from './deduction.types';

export class DeductionModel {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  type: DeductionType;
  amount: number | undefined;
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
    isActive: boolean,
    type = DeductionType.FIXED,
    amount: number | undefined = undefined,
    liableForEpf = false,
    liableForEtf = false,
    liableForPaye = false,
    liableNoPay = false,
    formula: string | undefined = undefined,
    formulaEnabled = false,
  ) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.description = description;
    this.isActive = isActive;
    this.type = type;
    this.amount = amount;
    this.liableForEpf = liableForEpf;
    this.liableForEtf = liableForEtf;
    this.liableForPaye = liableForPaye;
    this.liableNoPay = liableNoPay;
    this.formula = formula;
    this.formulaEnabled = formulaEnabled;
  }
}
