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


// All {{TOKEN}} placeholders supported by PayslipTokenMapper
export const PAYSLIP_TOKENS: { group: string; tokens: string[] }[] = [
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
    group: 'Period',
    tokens: ['{{PAYROLL_MONTH}}', '{{WORKING_DAYS}}'],
  },
  {
    group: 'Totals',
    tokens: [
      '{{GROSS_PAY}}', '{{TOTAL_DEDUCTIONS}}', '{{NET_PAY}}',
      '{{EPF_EMPLOYEE}}', '{{EPF_EMPLOYER}}', '{{ETF}}', '{{PAYE_TAX}}',
    ],
  },
  {
    group: 'Table Rows',
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
