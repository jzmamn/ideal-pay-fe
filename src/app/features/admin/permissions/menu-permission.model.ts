export interface MenuPermission {
  id:       string;
  menuItem: string;
  read:     boolean;
  create:   boolean;
  update:   boolean;
  visible:  boolean;
}

export const MENU_ITEMS: string[] = [
  'Dashboard',
  'Employee', 'Company', 'Department', 'Allowances', 'Deductions', 'Overtime',
  'Users', 'Group', 'Roles', 'Permissions',
];
