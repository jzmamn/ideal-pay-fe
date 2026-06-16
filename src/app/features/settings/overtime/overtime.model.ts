export class OvertimeModel {
  id: number;
  code: string;
  name: string;
  description: string | undefined;
  isActive: boolean;
  formula: string | undefined;
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
    this.liableForEpf   = liableForEpf;
    this.liableForEtf   = liableForEtf;
    this.liableForPaye  = liableForPaye;
    this.liableForNopay = liableForNopay;
  }
}
