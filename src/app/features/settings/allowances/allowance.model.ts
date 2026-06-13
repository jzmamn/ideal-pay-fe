import { AllowanceType } from './allowance.types';

export class AllowanceModel {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isTaxable: boolean;
  liableForEpf: boolean;
  liableForEtf: boolean;
  liableForPaye: boolean;
  liableNoPay: boolean;
  type: AllowanceType;
  /** Static fixed amount used when formulaEnabled = false. Null = not configured at company level. */
  amount: number | null;
  formula: string | undefined;
  formulaEnabled: boolean;

  constructor(
    id: number,
    code: string,
    name: string,
    description: string | null,
    isActive: boolean,
    isTaxable: boolean,
    liableForEpf: boolean,
    liableForEtf: boolean,
    liableForPaye: boolean,
    liableNoPay: boolean,
    type = AllowanceType.FIXED,
    amount: number | null = null,
    formula: string | undefined = undefined,
    formulaEnabled = false,
  ) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.description = description;
    this.isActive = isActive;
    this.isTaxable = isTaxable;
    this.liableForEpf = liableForEpf;
    this.liableForEtf = liableForEtf;
    this.liableForPaye = liableForPaye;
    this.liableNoPay = liableNoPay;
    this.type = type;
    this.amount = amount;
    this.formula = formula;
    this.formulaEnabled = formulaEnabled;
  }
}
