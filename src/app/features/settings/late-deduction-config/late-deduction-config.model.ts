export interface LateDeductionConfigModel {
  id:                 number;
  code:               string;
  name:               string;
  description:        string | undefined;
  workingDays:        number;
  workingHoursPerDay: number;
  isActive:           boolean;
  formula:            string | undefined;
  liableForEpf:       boolean;
  liableForEtf:       boolean;
  liableForPaye:      boolean;
  liableForNopay:     boolean;
}
