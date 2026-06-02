import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import {
  SalaryIncrementResponse,
  SalaryIncrementRequest,
  IncrementType,
  IncrementStatus,
} from './salary-increment.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class SalaryIncrementService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/salary-increment`;

  private unwrap = <T>(obs: Observable<ApiResponse<T>>) =>
    obs.pipe(map(r => r.data));

  getAll(filters?: { type?: IncrementType; status?: IncrementStatus; effectiveMonth?: string }):
    Observable<SalaryIncrementResponse[]> {
    let params = new HttpParams();
    if (filters?.type)           params = params.set('type',           filters.type);
    if (filters?.status)         params = params.set('status',         filters.status);
    if (filters?.effectiveMonth) params = params.set('effectiveMonth', filters.effectiveMonth);
    return this.unwrap(this.http.get<ApiResponse<SalaryIncrementResponse[]>>(this.base, { params }));
  }

  getById(id: number): Observable<SalaryIncrementResponse> {
    return this.unwrap(this.http.get<ApiResponse<SalaryIncrementResponse>>(`${this.base}/${id}`));
  }

  getByEmployee(empId: number): Observable<SalaryIncrementResponse[]> {
    return this.unwrap(this.http.get<ApiResponse<SalaryIncrementResponse[]>>(`${this.base}/employee/${empId}`));
  }

  create(req: SalaryIncrementRequest): Observable<SalaryIncrementResponse> {
    return this.unwrap(this.http.post<ApiResponse<SalaryIncrementResponse>>(this.base, req));
  }

  update(id: number, req: SalaryIncrementRequest): Observable<SalaryIncrementResponse> {
    return this.unwrap(this.http.put<ApiResponse<SalaryIncrementResponse>>(`${this.base}/${id}`, req));
  }

  delete(id: number): Observable<void> {
    return this.unwrap(this.http.delete<ApiResponse<void>>(`${this.base}/${id}`));
  }

  approve(id: number): Observable<SalaryIncrementResponse> {
    return this.unwrap(this.http.post<ApiResponse<SalaryIncrementResponse>>(`${this.base}/${id}/approve`, {}));
  }

  cancel(id: number): Observable<SalaryIncrementResponse> {
    return this.unwrap(this.http.post<ApiResponse<SalaryIncrementResponse>>(`${this.base}/${id}/cancel`, {}));
  }

  exportToPayroll(id: number): Observable<SalaryIncrementResponse> {
    return this.unwrap(this.http.post<ApiResponse<SalaryIncrementResponse>>(`${this.base}/${id}/export`, {}));
  }

  importFromPayroll(id: number): Observable<SalaryIncrementResponse> {
    return this.unwrap(this.http.post<ApiResponse<SalaryIncrementResponse>>(`${this.base}/${id}/import`, {}));
  }
}
