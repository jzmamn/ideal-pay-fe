export class OvertimeModel {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  liableForEPF: boolean;
  liableForETF: boolean;
  liableForNopay: boolean;

  constructor(
    id: number,
    code: string,
    name: string,
    isActive: boolean,
    liableForEPF = false,
    liableForETF = false,
    liableForNopay = false,
  ) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.isActive = isActive;
    this.liableForEPF = liableForEPF;
    this.liableForETF = liableForETF;
    this.liableForNopay = liableForNopay;
  }
}
