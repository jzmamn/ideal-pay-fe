export class NopayModel {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  liableForEpf: boolean;
  liableForEtf: boolean;
  liableForPaye: boolean;
  formula: string | undefined;
  formulaEnabled: boolean;

  constructor(
    id: number,
    code: string,
    name: string,
    description: string | null,
    isActive: boolean,
    liableForEpf: boolean,
    liableForEtf: boolean,
    liableForPaye: boolean,
    formula: string | undefined = undefined,
    formulaEnabled = false,
  ) {
    this.id             = id;
    this.code           = code;
    this.name           = name;
    this.description    = description;
    this.isActive       = isActive;
    this.liableForEpf   = liableForEpf;
    this.liableForEtf   = liableForEtf;
    this.liableForPaye  = liableForPaye;
    this.formula        = formula;
    this.formulaEnabled = formulaEnabled;
  }
}
