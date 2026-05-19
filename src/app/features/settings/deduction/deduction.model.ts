import { DeductionType } from './deduction.types';

export class DeductionModel {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  type: DeductionType;
  amount: number | undefined;
  liableForEPF: boolean;
  liableForETF: boolean;
  liableForNopay: boolean;

  constructor(
    id: number,
    code: string,
    name: string,
    isActive: boolean,
    type = DeductionType.FIXED,
    amount: number | undefined = undefined,
    liableForEPF = false,
    liableForETF = false,
    liableForNopay = false,
  ) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.isActive = isActive;
    this.type = type;
    this.amount = amount;
    this.liableForEPF = liableForEPF;
    this.liableForETF = liableForETF;
    this.liableForNopay = liableForNopay;
  }
}
