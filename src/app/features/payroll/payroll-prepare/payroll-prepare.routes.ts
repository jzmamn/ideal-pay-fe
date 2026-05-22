import { Routes } from '@angular/router';
import { CanDeactivateFn } from '@angular/router';
import { PayrollPrepareComponent } from './payroll-prepare.component';

export const payrollDirtyGuard: CanDeactivateFn<PayrollPrepareComponent> =
  (component) => {
    if (component.svc.dirtyCount() === 0) return true;
    return confirm('You have unsaved changes. Leave anyway?');
  };

export const PAYROLL_PREPARE_ROUTES: Routes = [
  {
    path: '',
    component: PayrollPrepareComponent,
    canDeactivate: [payrollDirtyGuard],
  },
];
