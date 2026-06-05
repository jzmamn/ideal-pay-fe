import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, from, map, catchError, switchMap, throwError } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { PayrollRunSummary } from '../shared/payroll-run.model';
import { PayslipLayout } from './payslip-template/payslip-template';

/**
 * When responseType is 'blob', Angular delivers error bodies as Blobs too.
 * Read the blob as text, parse the backend ApiResponseDTO, and re-throw an
 * Error whose message is the backend's human-readable string.
 */
function parseBlobError(err: HttpErrorResponse): Observable<never> {
  if (err.error instanceof Blob) {
    return from(err.error.text()).pipe(
      switchMap(text => {
        let message = 'PDF generation failed.';
        try {
          const body = JSON.parse(text);
          if (body?.message) message = body.message;
        } catch { /* keep default */ }
        return throwError(() => new Error(message));
      }),
    );
  }
  const fallback = (err.error as { message?: string })?.message ?? err.message ?? 'PDF generation failed.';
  return throwError(() => new Error(fallback));
}

export interface PayslipEmailRequest {
  runIds        : number[];
  layout        : PayslipLayout;
  templateId   ?: number | null;
  pdfTemplateId?: number | null;
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

  /**
   * Download the server-generated iText PDF for a single payroll run.
   *
   * responseType: 'blob' tells HttpClient to treat the response body as
   * binary instead of parsing it as JSON. The caller must call
   * URL.revokeObjectURL() after every use to prevent memory leaks.
   */
  downloadPdf(runId: number, templateId?: number | null): Observable<Blob> {
    const params = templateId ? new HttpParams().set('templateId', templateId) : undefined;

    return this.http.get(`${this.baseUrl}/pdf/${runId}`, {
      params,
      responseType: 'blob',
    }).pipe(catchError(parseBlobError));
  }

  /** Merged PDF for a selected list of run IDs (one payslip per page). */
  downloadSelected(runIds: number[], templateId?: number | null): Observable<Blob> {
    const params = templateId ? new HttpParams().set('templateId', templateId) : undefined;
    return this.http.post(`${this.baseUrl}/pdf/selected`, runIds, {
      params,
      responseType: 'blob',
    }).pipe(catchError(parseBlobError));
  }

  /**
   * Download an A4-landscape PDF with two payslips side by side.
   * Matches POST /payroll/payslip/pdf/2up with body [runId1, runId2].
   */
  downloadPdfPair(runId1: number, runId2: number, templateId?: number | null): Observable<Blob> {
    const params = templateId ? new HttpParams().set('templateId', templateId) : undefined;

    return this.http.post(`${this.baseUrl}/pdf/2up`, [runId1, runId2], {
      params,
      responseType: 'blob',
    }).pipe(catchError(parseBlobError));
  }
}
