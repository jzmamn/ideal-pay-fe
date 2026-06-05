import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';

// ── Types ────────────────────────────────────────────────────────────────────

export type TemplateType = 'PAYSLIP' | 'SALARY_ADVANCE' | 'SALARY_INCREMENT' | 'GENERAL';

export interface EmailTemplate {
  id              : number;
  name            : string;
  templateType    : TemplateType;
  subject         : string;
  body            : string;
  isActive        : boolean;
  emailConfigId  ?: number | null;
  emailConfigName?: string | null;
  createdDate    ?: string;
  modifiedDate   ?: string;
}

export interface EmailTemplateRequest {
  name          : string;
  templateType  : TemplateType;
  subject       : string;
  body          : string;
  isActive      : boolean;
  emailConfigId ?: number | null;
}

export const TEMPLATE_TYPE_LABELS: Record<TemplateType, string> = {
  PAYSLIP          : 'Payslip',
  SALARY_ADVANCE   : 'Salary Advance',
  SALARY_INCREMENT : 'Salary Increment',
  GENERAL          : 'General',
};

// ── Available template variables per type ────────────────────────────────────
export const TEMPLATE_VARIABLES: Record<TemplateType | 'COMMON', string[]> = {
  COMMON           : ['{{employee_name}}', '{{employee_no}}', '{{department}}', '{{company_name}}', '{{month}}', '{{year}}'],
  PAYSLIP          : ['{{net_pay}}', '{{gross_pay}}', '{{total_deductions}}'],
  SALARY_ADVANCE   : ['{{advance_amount}}', '{{repayment_month}}'],
  SALARY_INCREMENT : ['{{previous_salary}}', '{{new_salary}}', '{{effective_date}}', '{{increment_percentage}}'],
  GENERAL          : [],
};

// ── Service ──────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class EmailTemplateService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/email-template`;

  getAll(): Observable<EmailTemplate[]> {
    return this.http
      .get<ApiResponse<EmailTemplate[]>>(this.baseUrl)
      .pipe(map(r => r.data));
  }

  getActiveByType(type: TemplateType): Observable<EmailTemplate[]> {
    return this.http
      .get<ApiResponse<EmailTemplate[]>>(`${this.baseUrl}/active?type=${type}`)
      .pipe(map(r => r.data));
  }

  getById(id: number): Observable<EmailTemplate> {
    return this.http
      .get<ApiResponse<EmailTemplate>>(`${this.baseUrl}/${id}`)
      .pipe(map(r => r.data));
  }

  create(req: EmailTemplateRequest): Observable<EmailTemplate> {
    return this.http
      .post<ApiResponse<EmailTemplate>>(`${this.baseUrl}?userId=1`, req)
      .pipe(map(r => r.data));
  }

  update(id: number, req: EmailTemplateRequest): Observable<EmailTemplate> {
    return this.http
      .put<ApiResponse<EmailTemplate>>(`${this.baseUrl}/${id}?userId=1`, req)
      .pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
