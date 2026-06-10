import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [

    { path: '', redirectTo: 'login', pathMatch: 'full' },

    {
        path: 'login',
        loadComponent: () =>
            import('./login/login.component')
                .then(m => m.LoginComponent),
    },


    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () =>
            import('./layout/navigation/navigation.component')
                .then(m => m.NavigationComponent),

        children: [

            {
                path: 'data-table',
                loadComponent: () =>
                    import('./trial/master-data-table/master-data-table.component')
                        .then(m => m.MasterDataTableComponent)
            },

            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./features/dashboard/payroll-dashboard.component')
                        .then(m => m.PayrollDashboardComponent)
            },

            {
                path: 'payroll',
                loadComponent: () =>
                    import('./features/payroll/payroll')
                        .then(m => m.Payroll),
                children: [
                    {
                        path: '',
                        redirectTo: 'entry',
                        pathMatch: 'full',
                    },
                    {
                        path: 'entry',
                        loadComponent: () =>
                            import('./features/payroll/individual/individual')
                                .then(m => m.IndividualComponent),
                    },
                    {
                        path: 'pay-slip',
                        loadComponent: () =>
                            import('./features/payroll/pay-slip/pay-slip')
                                .then(m => m.PaySlip),
                    },
                    {
                        path: 'bank-transfer',
                        loadComponent: () =>
                            import('./features/payroll/bank-transfer/bank-transfer')
                                .then(m => m.BankTransfer),
                    },
                    {
                        path: 'batch',
                        loadComponent: () =>
                            import('./features/payroll/batch/batch')
                                .then(m => m.BatchComponent),
                    },
                    {
                        path: 'run-review',
                        loadComponent: () =>
                            import('./features/payroll/run-review/run-review')
                                .then(m => m.RunReviewComponent),
                    },
                    {
                        path: 'salary-advance',
                        loadComponent: () =>
                            import('./features/payroll/salary-advance/salary-advance')
                                .then(m => m.SalaryAdvance),
                    },
                    {
                        path: 'loan-application',
                        loadComponent: () =>
                            import('./features/payroll/loan-application/loan-application')
                                .then(m => m.LoanApplication),
                    },
                    {
                        path: 'salary-increment',
                        loadComponent: () =>
                            import('./features/payroll/salary-increment/salary-increment')
                                .then(m => m.SalaryIncrementComponent),
                    },
                ],
            },

            {
                path: 'reports',
                loadComponent: () =>
                    import('./features/reports/reports')
                        .then(m => m.Reports)
            },

            {
                path: 'reports/statutory',
                loadComponent: () =>
                    import('./features/reports/statutory/statutory-reports')
                        .then(m => m.StatutoryReports)
            },

            {
                path: 'company',
                loadComponent: () =>
                    import('./features/infrastructure/company/companies')
                        .then(m => m.Companies)
            },

            {
                path: 'department',
                loadComponent: () =>
                    import('./features/infrastructure/department/department')
                        .then(m => m.Department)
            },

            {
                path: 'allowance',
                loadComponent: () =>
                    import('./features/settings/allowances/allowances')
                        .then(m => m.Allowances)
            },

            {
                path: 'allowances/fixed',
                loadComponent: () =>
                    import('./features/settings/allowances/fixed/fixed-allowances')
                        .then(m => m.FixedAllowances)
            },

            {
                path: 'allowances/variable',
                loadComponent: () =>
                    import('./features/settings/allowances/variable/variable-allowances')
                        .then(m => m.VariableAllowances)
            },

            {
                path: 'bonus',
                loadComponent: () =>
                    import('./features/settings/bonus/bonus-master')
                        .then(m => m.BonusMaster)
            },

            {
                path: 'deduction',
                loadComponent: () =>
                    import('./features/settings/deduction/deduction')
                        .then(m => m.Deduction)
            },

            {
                path: 'deductions/fixed',
                loadComponent: () =>
                    import('./features/settings/deduction/fixed/fixed-deductions')
                        .then(m => m.FixedDeductions)
            },

            {
                path: 'deductions/variable',
                loadComponent: () =>
                    import('./features/settings/deduction/variable/variable-deductions')
                        .then(m => m.VariableDeductions)
            },

            {
                path: 'overtime',
                loadComponent: () =>
                    import('./features/settings/overtime/overtime')
                        .then(m => m.Overtime)
            },

            {
                path: 'late-deduction-config',
                loadComponent: () =>
                    import('./features/settings/late-deduction-config/late-deduction-config')
                        .then(m => m.LateDeductionConfig)
            },

            {
                path: 'loan',
                loadComponent: () =>
                    import('./features/settings/loan/loan')
                        .then(m => m.Loan)
            },

            {
                path: 'job-categories',
                loadComponent: () =>
                    import('./features/infrastructure/job-categories/job-categories')
                        .then(m => m.JobCategories)
            },

            {
                path: 'branches',
                loadComponent: () =>
                    import('./features/infrastructure/branches/branches')
                        .then(m => m.Branches)
            },

            {
                path: 'grades',
                loadComponent: () =>
                    import('./features/infrastructure/grades/grades')
                        .then(m => m.Grades)
            },

            {
                path: 'designations',
                loadComponent: () =>
                    import('./features/infrastructure/designations/designations')
                        .then(m => m.Designations)
            },

            {
                path: 'email-setup',
                loadComponent: () =>
                    import('./features/infrastructure/email-setup/email-setup')
                        .then(m => m.EmailSetup)
            },

            {
                path: 'payslip-template',
                loadComponent: () =>
                    import('./features/infrastructure/payslip-template/payslip-template-manager')
                        .then(m => m.PayslipTemplateManager)
            },

            { path: 'email-settings', redirectTo: 'email-setup', pathMatch: 'full' },

            {
                path: 'nopay',
                loadComponent: () =>
                    import('./features/settings/nopay/nopay-days')
                        .then(m => m.NopayDays)
            },

            {
                path: 'employee-types',
                loadComponent: () =>
                    import('./features/infrastructure/type/type')
                        .then(m => m.EmployeeType)
            },

            {
                path: 'countries',
                loadComponent: () =>
                    import('./features/infrastructure/country/countries')
                        .then(m => m.Countries)
            },

            {
                path: 'districts',
                loadComponent: () =>
                    import('./features/infrastructure/district/districts')
                        .then(m => m.Districts)
            },

            {
                path: 'users',
                loadComponent: () =>
                    import('./features/admin/users/users')
                        .then(m => m.Users)
            },

            {
                path: 'group',
                loadComponent: () =>
                    import('./features/admin/group/groups')
                        .then(m => m.Groups)
            },

            {
                path: 'roles',
                loadComponent: () =>
                    import('./features/admin/roles/roles')
                        .then(m => m.Roles)
            },

            {
                path: 'permissions',
                loadComponent: () =>
                    import('./features/admin/permissions/permissions')
                        .then(m => m.Permissions)
            },

            {
                path: 'license',
                loadComponent: () => import('./features/admin/license/license').then(m => m.LicenseComponent)
            },

            {
                path: 'employee',
                loadComponent: () =>
                    import('./features/settings/employee/employee')
                        .then(m => m.Employee),

                children: [

                    {
                        path: '',
                        data: { animation: 0 },
                        loadComponent: () =>
                            import('./features/settings/employee/employee-home/employee-home')
                                .then(m => m.EmployeeHome)
                    },

                    {
                        path: 'info',
                        data: { animation: 1 },
                        loadComponent: () =>
                            import('./features/settings/employee/employee-info/employee-info')
                                .then(m => m.EmployeeInfo)
                    },

                    {
                        path: 'add',
                        data: { animation: 2 },
                        loadComponent: () =>
                            import('./features/settings/employee/employee-form/employee-form')
                                .then(m => m.EmployeeForm)
                    },
                ]

            },

            //test and trials of angular features and concepts
            {
                path: 'emp-parent',
                loadComponent: () =>
                    import('./trial/employee-parent/employee-parent')
                        .then(m => m.EmployeeParent),

                children: [

                    {
                        path: '',
                        loadComponent: () =>
                            import('./trial/employee-list/employee-list')
                                .then(m => m.EmployeeList)
                    },

                    {
                        path: 'test-forms',
                        loadComponent: () =>
                            import('./trial/test-forms/test-forms')
                                .then(m => m.TestForms)
                    },

                    {
                        path: 'test-tables',
                        loadComponent: () =>
                            import('./trial/test-tables/test-tables')
                                .then(m => m.TestTables)
                    }
                ]

            },

        ]

    },

    { path: '**', redirectTo: 'login' },

];

