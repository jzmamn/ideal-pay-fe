import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';

export interface BatchEntry {
  allowanceCode: string;
  employeeId: number;
  amount: number;
}

export interface BatchSavePayload {
  periodMonth: number;
  periodYear: number;
  entries: BatchEntry[];
}

@Injectable({ providedIn: 'root' })
export class BatchService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/batch-allowance`;

  load(periodMonth: number, periodYear: number): Observable<BatchEntry[]> {
    return this.http
      .get<ApiResponse<BatchEntry[]>>(`${this.baseUrl}?month=${periodMonth}&year=${periodYear}`)
      .pipe(map(r => r.data));
  }

  save(payload: BatchSavePayload): Observable<void> {
    return this.http.post<void>(this.baseUrl, payload);
  }
}
