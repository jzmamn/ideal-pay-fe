export class OvertimeModel {
  id: number;
  code: string;
  name: string;
  description: string | undefined;
  isActive: boolean;
  formula: string | undefined;
  formulaEnabled: boolean;
  liableForEpf: boolean;
  liableForEtf: boolean;
  liableForPaye: boolean;
  liableForNopay: boolean;

  constructor(
    id: number,
    code: string,
    name: string,
    description: string | undefined,
    isActive: boolean,
    formula: string | undefined,
    formulaEnabled: boolean,
    liableForEpf = true,
    liableForEtf = true,
    liableForPaye = true,
    liableForNopay = false,
  ) {
    this.id             = id;
    this.code           = code;
    this.name           = name;
    this.description    = description;
    this.isActive       = isActive;
    this.formula        = formula;
    this.formulaEnabled = formulaEnabled;
    this.liableForEpf   = liableForEpf;
    this.liableForEtf   = liableForEtf;
    this.liableForPaye  = liableForPaye;
    this.liableForNopay = liableForNopay;
  }
}
