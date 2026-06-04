import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { BankTransferRow, BankTransferTemplate, TransferType } from './bank-transfer.model';

@Injectable({ providedIn: 'root' })
export class BankTransferService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/bank-transfer`;

  // ── Templates ───────────────────────────────────────────────────────────────

  getTemplates(): Observable<BankTransferTemplate[]> {
    return this.http
      .get<ApiResponse<BankTransferTemplate[]>>(`${this.baseUrl}/template`)
      .pipe(map(r => r.data));
  }

  saveTemplate(t: BankTransferTemplate): Observable<BankTransferTemplate> {
    if (t.id) {
      return this.http
        .put<ApiResponse<BankTransferTemplate>>(`${this.baseUrl}/template/${t.id}`, t)
        .pipe(map(r => r.data));
    }
    return this.http
      .post<ApiResponse<BankTransferTemplate>>(`${this.baseUrl}/template`, t)
      .pipe(map(r => r.data));
  }

  deleteTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/template/${id}`);
  }

  // ── Transfer rows ───────────────────────────────────────────────────────────

  /**
   * Returns LOCKED payroll-run rows that have not yet been transferred,
   * enriched with employee bank/account info.
   * Only rows matching the requested transfer types are included in totalAmount.
   */
  getTransferRows(payrollMonth: string, types: TransferType[]): Observable<BankTransferRow[]> {
    const params = new HttpParams()
      .set('month', payrollMonth)
      .set('types', types.join(','));
    return this.http
      .get<ApiResponse<BankTransferRow[]>>(`${this.baseUrl}/preview`, { params })
      .pipe(map(r => r.data));
  }

  /**
   * Marks the given payroll-run IDs as transferred.
   * Should be called once after the bank file is downloaded.
   */
  markTransferred(runIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/transfer`, { runIds });
  }
}
