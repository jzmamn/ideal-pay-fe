import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { PayrollRunSummary } from '../shared/payroll-run.model';
import { PayslipLayout } from './payslip-template/payslip-template';

export interface PayslipEmailRequest {
  runIds   : number[];
  layout   : PayslipLayout;
}

export interface PayslipEmailResult {
  sent   : number;
  failed : number;
  errors?: string[];
}

@Injectable({ providedIn: 'root' })
export class PayslipService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/payslip`;

  /** Get all payroll run summaries for an employee (all months). */
  getRunsByEmployee(empId: number): Observable<PayrollRunSummary[]> {
    return this.http
      .get<ApiResponse<PayrollRunSummary[]>>(`${this.baseUrl}/employee/${empId}`)
      .pipe(map(r => r.data));
  }

  /** Get all run summaries for a payroll month e.g. "2026-05". */
  getRunsByMonth(payrollMonth: string): Observable<PayrollRunSummary[]> {
    return this.http
      .get<ApiResponse<PayrollRunSummary[]>>(`${this.baseUrl}/month/${payrollMonth}`)
      .pipe(map(r => r.data));
  }

  /** Email payslips to the employees linked to the provided run IDs. */
  emailPayslips(req: PayslipEmailRequest): Observable<PayslipEmailResult> {
    return this.http
      .post<ApiResponse<PayslipEmailResult>>(`${this.baseUrl}/email`, req)
      .pipe(map(r => r.data));
  }
}
