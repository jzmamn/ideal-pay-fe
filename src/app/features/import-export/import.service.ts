import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../api-url.token';
import { ApiResponse } from '../../shared/models/api-response.model';

// ── Types ─────────────────────────────────────────────────────────────────

export type ImportEntity =
  | 'EMP_NOPAY' | 'EMP_OT' | 'EMP_LATE' | 'EMP_SALARY_ADVANCE'
  | 'EMP_BONUS' | 'EMP_FA' | 'EMP_FD' | 'EMP_LOAN'
  | 'EMP_SAL_INCR' | 'EMP_VA' | 'EMP_VD' | 'EMP_GRATUITY';
export type ImportFormat = 'xlsx' | 'csv';
export type ImportStatus = 'COMMITTED' | 'ROLLED_BACK' | 'LOCKED';

export interface RowError {
  rowNum: number;
  field: string;
  message: string;
}

export interface ImportRow {
  rowNum: number;
  values: Record<string, string>;
  errors: RowError[];
}

export interface ImportPreview {
  sessionId: string;
  entity: ImportEntity;
  payrollMonth: string;
  fileName: string;
  detectedHeaders: string[];
  expectedFields: string[];
  mapping: Record<string, string>;
  totalRows: number;
  validRows: number;
  errorRows: number;
  rows: ImportRow[];
}

export interface ImportCommitResult {
  importLogId: number;
  insertedRows: number;
  skippedRows: number;
}

export interface ImportFormatSpec {
  entity: ImportEntity;
  expectedFields: string[];
  requiredFields: string[];
  keyFields: string[];
  numericFields: string[];
  supportedFormats: string[];
  sampleRow: string[];
}

export interface ImportLogEntry {
  id: number;
  entity: ImportEntity;
  payrollMonth: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  status: ImportStatus;
  errorDetail: RowError[];
  createdBy: string;
  createdAt: string;
}

export const IMPORT_ENTITIES: ReadonlyArray<{ value: ImportEntity; label: string }> = [
  { value: 'EMP_NOPAY',          label: 'No Pay'             },
  { value: 'EMP_OT',             label: 'Overtime'           },
  { value: 'EMP_LATE',           label: 'Late Deduction'     },
  { value: 'EMP_SALARY_ADVANCE', label: 'Salary Advance'     },
  { value: 'EMP_BONUS',          label: 'Bonus'              },
  { value: 'EMP_FA',             label: 'Fixed Allowance'    },
  { value: 'EMP_FD',             label: 'Fixed Deduction'    },
  { value: 'EMP_LOAN',           label: 'Loan'               },
  { value: 'EMP_SAL_INCR',       label: 'Salary Increment'   },
  { value: 'EMP_VA',             label: 'Variable Allowance' },
  { value: 'EMP_VD',             label: 'Variable Deduction' },
  { value: 'EMP_GRATUITY',       label: 'Gratuity'           },
];

// ── Service ───────────────────────────────────────────────────────────────

/** Audit user sent while security is permitAll. TODO: replace with AuthService user id */
const DEFAULT_USER_ID = 1;

@Injectable({ providedIn: 'root' })
export class ImportService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  upload(file: File, entity: ImportEntity, payrollMonth: string): Observable<ImportPreview> {
    const form = new FormData();
    form.append('file', file);
    form.append('entity', entity);
    form.append('payrollMonth', payrollMonth);
    form.append('userId', String(DEFAULT_USER_ID));
    return this.http
      .post<ApiResponse<ImportPreview>>(`${this.base}/import/upload`, form)
      .pipe(map(r => r.data));
  }

  validate(sessionId: string, mapping: Record<string, string>): Observable<ImportPreview> {
    return this.http
      .post<ApiResponse<ImportPreview>>(`${this.base}/import/validate`, { sessionId, mapping })
      .pipe(map(r => r.data));
  }

  commit(sessionId: string): Observable<ImportCommitResult> {
    return this.http
      .post<ApiResponse<ImportCommitResult>>(`${this.base}/import/commit/${sessionId}`, null, {
        params: new HttpParams().set('userId', DEFAULT_USER_ID),
      })
      .pipe(map(r => r.data));
  }

  rollback(importLogId: number): Observable<ImportLogEntry> {
    return this.http
      .delete<ApiResponse<ImportLogEntry>>(`${this.base}/import/rollback/${importLogId}`)
      .pipe(map(r => r.data));
  }

  /** Expected file layout (columns, rules, sample row) for every entity. */
  getFormats(): Observable<ImportFormatSpec[]> {
    return this.http
      .get<ApiResponse<ImportFormatSpec[]>>(`${this.base}/import/formats`)
      .pipe(map(r => r.data));
  }

  getLogs(): Observable<ImportLogEntry[]> {
    return this.http
      .get<ApiResponse<ImportLogEntry[]>>(`${this.base}/import/log`)
      .pipe(map(r => r.data));
  }

  downloadTemplate(entity: ImportEntity, format: ImportFormat): Observable<Blob> {
    return this.http.get(`${this.base}/import/template/${entity}`, {
      params: new HttpParams().set('format', format),
      responseType: 'blob',
    });
  }

  exportData(entity: ImportEntity, payrollMonth: string, format: ImportFormat): Observable<Blob> {
    return this.http.get(`${this.base}/export/${entity}`, {
      params: new HttpParams().set('format', format).set('month', payrollMonth),
      responseType: 'blob',
    });
  }

  /** Triggers a browser download for a fetched blob. */
  saveBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
