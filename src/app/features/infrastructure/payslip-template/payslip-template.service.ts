import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';

export interface PayslipTemplateResponse {
  id                : number;
  name              : string;
  htmlContent       : string;
  isActive          : boolean;
  createdById       : number;
  createdByUserName : string;
  createdDate       : string;
  modifiedById      : number;
  modifiedByUserName: string;
  modifiedDate      : string;
}

export interface PayslipTemplateRequest {
  name       : string;
  htmlContent: string;
  isActive   : boolean;
  createdBy  : number;
  modifiedBy : number;
}


// All {{TOKEN}} placeholders supported by PayslipTokenMapper.
// Dynamic code-based tokens (FA_*, FD_*, OT_*, VA_*, VD_*) resolve at runtime
// by matching the suffix against the employee's allowance/deduction/overtime codes.
// Label tokens (lbl*) output a static display name and can be used independently
// of their value counterparts — e.g. {{lblBasicSalary}}: {{BASIC_SALARY}}.
export const PAYSLIP_TOKENS: { group: string; tokens: string[]; dynamicPrefixes?: string[] }[] = [
  {
    group: 'Company',
    tokens: [
      '{{COMPANY_NAME}}', '{{COMPANY_ADDRESS}}', '{{COMPANY_PHONE}}',
      '{{COMPANY_EMAIL}}', '{{COMPANY_LOGO}}', '{{COMPANY_EPF_NO}}', '{{COMPANY_ETF_NO}}',
    ],
  },
  {
    group: 'Employee',
    tokens: [
      '{{EMPLOYEE_NO}}', '{{EMPLOYEE_NAME}}', '{{PAYROLL_NAME}}',
      '{{DESIGNATION}}', '{{DEPARTMENT}}', '{{EMPLOYEE_EPF_NO}}',
      '{{BANK_NAME}}', '{{BANK_BRANCH}}', '{{ACCOUNT_NO}}',
    ],
  },
  {
    group: 'Payroll Period',
    tokens: ['{{PAYROLL_MONTH}}', '{{WORKING_DAYS}}'],
  },
  {
    group: 'Financials',
    dynamicPrefixes: ['FA_', 'FD_', 'OT_', 'VA_', 'VD_'],
    tokens: [
      '{{BASIC_SALARY}}', '{{GROSS_PAY}}', '{{TOTAL_DEDUCTIONS}}', '{{NET_PAY}}',
      '{{EPF_EMPLOYEE}}', '{{EPF_EMPLOYER}}', '{{ETF}}', '{{PAYE_TAX}}',
      '{{NOPAY}}', '{{NOPAY_DAYS}}', '{{NOPAY_AMOUNT}}', '{{LATE_DEDUCTION}}',
      '{{FIXED_ALLOWANCE}}', '{{FIXED_DEDUCTION}}',
      '{{OVERTIME}}', '{{OT_HOURS}}', '{{OT_AMOUNT}}',
      '{{VARIABLE_ALLOWANCE}}', '{{BONUS}}', '{{INCREMENT}}', '{{GRATUITY}}',
      '{{VARIABLE_DEDUCTION}}',
    ],
  },
  {
    group: 'Dynamic Component Tokens',
    dynamicPrefixes: ['FA_', 'FD_', 'OT_', 'VA_', 'VD_', 'lbl_FA_', 'lbl_FD_', 'lbl_OT_', 'lbl_VA_', 'lbl_VD_'],
    tokens: [
      // These are examples — the actual token is FA_<YOUR_CODE>, e.g. {{FA_HRA}}
      // The lbl_ prefix gives the component name: {{lbl_FA_HRA}} → "House Rent Allowance"
      '{{FA_CODE}}', '{{lbl_FA_CODE}}',
      '{{FD_CODE}}', '{{lbl_FD_CODE}}',
      '{{OT_CODE}}', '{{lbl_OT_CODE}}',
      '{{VA_CODE}}', '{{lbl_VA_CODE}}',
      '{{VD_CODE}}', '{{lbl_VD_CODE}}',
    ],
  },
  {
    group: 'Labels',
    tokens: [
      '{{lblBasicSalary}}',      '{{lblGrossPay}}',         '{{lblNetPay}}',
      '{{lblTotalDeductions}}',  '{{lblEpfEmployee}}',       '{{lblEpfEmployer}}',
      '{{lblEtf}}',              '{{lblPayeTax}}',           '{{lblNopay}}',
      '{{lblLateDeduction}}',    '{{lblFixedAllowance}}',    '{{lblFixedDeduction}}',
      '{{lblOvertime}}',         '{{lblVariableAllowance}}', '{{lblBonus}}',
      '{{lblIncrement}}',        '{{lblGratuity}}',          '{{lblVariableDeduction}}',
      '{{lblWorkingDays}}',      '{{lblPayrollMonth}}',
      '{{lblCompanyName}}',      '{{lblEmployeeNo}}',        '{{lblEmployeeName}}',
      '{{lblDesignation}}',      '{{lblDepartment}}',        '{{lblEpfNo}}',
      '{{lblBankName}}',         '{{lblBankBranch}}',        '{{lblAccountNo}}',
    ],
  },
  {
    group: 'Dynamic Table Rows',
    tokens: ['{{EARNINGS_ROWS}}', '{{DEDUCTIONS_ROWS}}', '{{EMPLOYER_ROWS}}'],
  },
];

@Injectable({ providedIn: 'root' })
export class PayslipTemplateService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/payslip-template`;

  getAll(isActive: 'true' | 'false' | 'all' = 'all'): Observable<PayslipTemplateResponse[]> {
    const params = new HttpParams().set('isActive', isActive);
    return this.http
      .get<ApiResponse<PayslipTemplateResponse[]>>(this.baseUrl, { params })
      .pipe(map(r => r.data));
  }

  getById(id: number): Observable<PayslipTemplateResponse> {
    return this.http
      .get<ApiResponse<PayslipTemplateResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map(r => r.data));
  }

  getActive(): Observable<PayslipTemplateResponse> {
    return this.http
      .get<ApiResponse<PayslipTemplateResponse>>(`${this.baseUrl}/active`)
      .pipe(map(r => r.data));
  }

  getAllActive(): Observable<PayslipTemplateResponse[]> {
    return this.getAll('true');
  }

  save(req: PayslipTemplateRequest): Observable<PayslipTemplateResponse> {
    return this.http
      .post<ApiResponse<PayslipTemplateResponse>>(this.baseUrl, req)
      .pipe(map(r => r.data));
  }

  update(id: number, req: PayslipTemplateRequest): Observable<PayslipTemplateResponse> {
    return this.http
      .put<ApiResponse<PayslipTemplateResponse>>(`${this.baseUrl}/${id}`, req)
      .pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.baseUrl}/${id}`)
      .pipe(map(() => undefined));
  }

}
