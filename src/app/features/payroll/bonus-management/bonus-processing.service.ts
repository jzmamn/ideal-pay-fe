import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import {
  BonusApprovalReport,
  BonusCalculateRequest,
  BonusDepartmentReport,
  BonusEntryRow,
  BonusProcessingBatch,
  BonusSummaryReport,
} from './bonus-processing.model';

@Injectable({ providedIn: 'root' })
export class BonusProcessingService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/bonus-processing`;

  // ── Batch lifecycle ─────────────────────────────────────────────────────────

  calculate(request: BonusCalculateRequest): Observable<BonusProcessingBatch> {
    return this.http
      .post<ApiResponse<BonusProcessingBatch>>(`${this.baseUrl}/calculate`, request)
      .pipe(map(r => r.data));
  }

  getBatches(payrollMonth?: string, status?: string): Observable<BonusProcessingBatch[]> {
    let params = new HttpParams();
    if (payrollMonth) params = params.set('payrollMonth', payrollMonth);
    if (status)       params = params.set('status', status);
    return this.http
      .get<ApiResponse<BonusProcessingBatch[]>>(`${this.baseUrl}/batches`, { params })
      .pipe(map(r => r.data));
  }

  getBatchById(id: number): Observable<BonusProcessingBatch> {
    return this.http
      .get<ApiResponse<BonusProcessingBatch>>(`${this.baseUrl}/batches/${id}`)
      .pipe(map(r => r.data));
  }

  approveBatch(id: number, actingUserId: number, notes?: string): Observable<BonusProcessingBatch> {
    return this.http
      .post<ApiResponse<BonusProcessingBatch>>(
        `${this.baseUrl}/batches/${id}/approve`,
        { actingUserId, notes },
      )
      .pipe(map(r => r.data));
  }

  processBatch(id: number, actingUserId: number, notes?: string): Observable<BonusProcessingBatch> {
    return this.http
      .post<ApiResponse<BonusProcessingBatch>>(
        `${this.baseUrl}/batches/${id}/process`,
        { actingUserId, notes },
      )
      .pipe(map(r => r.data));
  }

  cancelBatch(id: number, actingUserId: number, notes?: string): Observable<BonusProcessingBatch> {
    return this.http
      .post<ApiResponse<BonusProcessingBatch>>(
        `${this.baseUrl}/batches/${id}/cancel`,
        { actingUserId, notes },
      )
      .pipe(map(r => r.data));
  }

  adjustEntry(
    batchId: number,
    entryId: number,
    adjustedAmount: number,
    note: string,
    modifiedBy: number,
  ): Observable<BonusEntryRow> {
    return this.http
      .put<ApiResponse<BonusEntryRow>>(
        `${this.baseUrl}/batches/${batchId}/entries/${entryId}`,
        { adjustedAmount, note, modifiedBy },
      )
      .pipe(map(r => r.data));
  }

  // ── Reports ─────────────────────────────────────────────────────────────────

  getSummaryReport(payrollMonth?: string): Observable<BonusSummaryReport[]> {
    let params = new HttpParams();
    if (payrollMonth) params = params.set('payrollMonth', payrollMonth);
    return this.http
      .get<ApiResponse<BonusSummaryReport[]>>(`${this.baseUrl}/reports/summary`, { params })
      .pipe(map(r => r.data));
  }

  getEmployeeReport(payrollMonth?: string, bonusId?: number): Observable<BonusEntryRow[]> {
    let params = new HttpParams();
    if (payrollMonth) params = params.set('payrollMonth', payrollMonth);
    if (bonusId)      params = params.set('bonusId', bonusId);
    return this.http
      .get<ApiResponse<BonusEntryRow[]>>(`${this.baseUrl}/reports/employee`, { params })
      .pipe(map(r => r.data));
  }

  getDepartmentReport(payrollMonth?: string): Observable<BonusDepartmentReport[]> {
    let params = new HttpParams();
    if (payrollMonth) params = params.set('payrollMonth', payrollMonth);
    return this.http
      .get<ApiResponse<BonusDepartmentReport[]>>(`${this.baseUrl}/reports/department`, { params })
      .pipe(map(r => r.data));
  }

  getApprovalReport(payrollMonth?: string): Observable<BonusApprovalReport[]> {
    let params = new HttpParams();
    if (payrollMonth) params = params.set('payrollMonth', payrollMonth);
    return this.http
      .get<ApiResponse<BonusApprovalReport[]>>(`${this.baseUrl}/reports/approval`, { params })
      .pipe(map(r => r.data));
  }
}
