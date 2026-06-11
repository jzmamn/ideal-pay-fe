import { Routes } from '@angular/router';

export const IMPORT_EXPORT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./import-wizard/import-wizard.component')
        .then(m => m.ImportWizardComponent),
  },
  {
    path: 'log',
    loadComponent: () =>
      import('./import-log/import-log.component')
        .then(m => m.ImportLogComponent),
  },
];
