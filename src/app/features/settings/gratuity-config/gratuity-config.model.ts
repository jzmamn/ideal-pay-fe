export interface GratuityConfigModel {
  id:             number;
  code:           string;
  name:           string;
  description:    string | undefined;
  formula:        string | undefined;
  formulaEnabled: boolean;
  isActive:       boolean;
}
