import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { PayrollRunResponse, PayrollRunSummary } from './payroll-run.model';

@Injectable({ providedIn: 'root' })
export class PayrollRunService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/payroll-run`;

  /** Process individual payroll — creates / replaces DRAFT run. */
  processIndividual(empId: number, payrollMonth: string, processedBy: number): Observable<PayrollRunResponse> {
    return this.http
      .post<ApiResponse<PayrollRunResponse>>(
        `${this.baseUrl}/process/${empId}/${payrollMonth}`,
        null,
        { params: new HttpParams().set('processedBy', processedBy) },
      )
      .pipe(map(r => r.data));
  }

  /** Process all active employees for a month — returns one summary per employee. */
  processBatch(payrollMonth: string, processedBy: number): Observable<PayrollRunSummary[]> {
    return this.http
      .post<ApiResponse<PayrollRunSummary[]>>(
        `${this.baseUrl}/process-month/${payrollMonth}`,
        null,
        { params: new HttpParams().set('processedBy', processedBy) },
      )
      .pipe(map(r => r.data));
  }

  /** Lock a DRAFT run — makes it final. */
  lock(runId: number, lockedBy: number): Observable<PayrollRunResponse> {
    return this.http
      .post<ApiResponse<PayrollRunResponse>>(
        `${this.baseUrl}/lock/${runId}`,
        null,
        { params: new HttpParams().set('lockedBy', lockedBy) },
      )
      .pipe(map(r => r.data));
  }

  /** Get full run detail by id. */
  getById(runId: number): Observable<PayrollRunResponse> {
    return this.http
      .get<ApiResponse<PayrollRunResponse>>(`${this.baseUrl}/${runId}`)
      .pipe(map(r => r.data));
  }

  /** Get all runs for a month (used by batch draft view). */
  getByMonth(payrollMonth: string): Observable<PayrollRunSummary[]> {
    return this.http
      .get<ApiResponse<PayrollRunSummary[]>>(`${this.baseUrl}/month/${payrollMonth}`)
      .pipe(map(r => r.data));
  }
}
