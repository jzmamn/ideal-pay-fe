import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../../api-url.token';
import { ApiResponse } from '../../shared/models/api-response.model';
import { ReportDefinition, ReportRow } from './report-definition.model';

/**
 * Talks to the generic report engine (ADR-001, Option B):
 *   GET /payroll/reports             — list active report definitions
 *   GET /payroll/reports/{key}       — single report's metadata
 *   GET /payroll/reports/{key}/run   — execute the report with filter values
 *
 * The component never needs report-specific methods here — every report,
 * present and future, flows through these three calls driven by metadata.
 */
@Injectable({ providedIn: 'root' })
export class ReportsService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/reports`;

  list(): Observable<ReportDefinition[]> {
    return this.http
      .get<ApiResponse<ReportDefinition[]>>(this.baseUrl)
      .pipe(map(res => res.data));
  }

  getDefinition(reportKey: string): Observable<ReportDefinition> {
    return this.http
      .get<ApiResponse<ReportDefinition>>(`${this.baseUrl}/${reportKey}`)
      .pipe(map(res => res.data));
  }

  run(reportKey: string, filters: Record<string, string>): Observable<ReportRow[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value);
      }
    }
    // TODO: replace with AuthService user id once available (matches the
    // `runBy`/`processedBy` convention used elsewhere, e.g. batch.ts).
    params = params.set('runBy', '1');

    return this.http
      .get<ApiResponse<ReportRow[]>>(`${this.baseUrl}/${reportKey}/run`, { params })
      .pipe(map(res => res.data));
  }
}
