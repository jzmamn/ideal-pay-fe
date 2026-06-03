import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';

export type SalAdvStatus = 'DRAFT' | 'LOCKED';

export interface SalAdvEntry {
  id:           number;
  empId:        number;
  empCode:      string;
  empName:      string;
  amount:       number;
  status:       SalAdvStatus;
  lockedDate:   string | null;
  lockedByName: string | null;
}

@Injectable({ providedIn: 'root' })
export class SalaryAdvanceService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/salary-advance`;

  getByPeriod(month: number, year: number): Observable<SalAdvEntry[]> {
    return this.http
      .get<ApiResponse<SalAdvEntry[]>>(`${this.baseUrl}?month=${month}&year=${year}`)
      .pipe(map(r => r.data));
  }

  lockEntry(entryId: number, lockedBy: number): Observable<SalAdvEntry> {
    return this.http
      .post<ApiResponse<SalAdvEntry>>(
        `${this.baseUrl}/lock/${entryId}`,
        null,
        { params: new HttpParams().set('lockedBy', lockedBy) },
      )
      .pipe(map(r => r.data));
  }

  lockAll(month: number, year: number, lockedBy: number): Observable<void> {
    return this.http
      .post<void>(
        `${this.baseUrl}/lock-all`,
        null,
        {
          params: new HttpParams()
            .set('month', month)
            .set('year', year)
            .set('lockedBy', lockedBy),
        },
      );
  }
}
