import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { RunReviewRow } from './run-review.model';

@Injectable({ providedIn: 'root' })
export class RunReviewService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/payroll/run-review`;

  /**
   * Fetch the pre/post comparison for every employee × component
   * for the given payroll month (e.g. "2026-06").
   */
  getReview(payrollMonth: string, viewedBy = 1): Observable<RunReviewRow[]> {
    const params = new HttpParams()
      .set('month', payrollMonth)
      .set('viewedBy', viewedBy);
    return this.http
      .get<ApiResponse<RunReviewRow[]>>(this.baseUrl, { params })
      .pipe(map(r => r.data));
  }
}
