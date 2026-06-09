export class BonusModel {
  id: number;
  code: string;
  name: string;
  description: string | null;
  amount: number | null;
  isActive: boolean;
  isTaxable: boolean;
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
    amount: number | null,
    isActive: boolean,
    isTaxable: boolean,
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
    this.amount = amount;
    this.isActive = isActive;
    this.isTaxable = isTaxable;
    this.liableForEpf = liableForEpf;
    this.liableForEtf = liableForEtf;
    this.liableForPaye = liableForPaye;
    this.liableNoPay = liableNoPay;
    this.formula = formula;
    this.formulaEnabled = formulaEnabled;
  }
}
