import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import { GratuityRequest, GratuityResponse, GratuityStatus } from './gratuity.model';

interface ApiResponse<T> { success: boolean; message: string; data: T; }

@Injectable({ providedIn: 'root' })
export class GratuityService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/gratuity`;

  private unwrap = <T>(obs: Observable<ApiResponse<T>>) => obs.pipe(map(r => r.data));

  getAll(filters?: { status?: GratuityStatus; empId?: number }): Observable<GratuityResponse[]> {
    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.empId)  params = params.set('empId',  filters.empId);
    return this.unwrap(this.http.get<ApiResponse<GratuityResponse[]>>(this.base, { params }));
  }

  getById(id: number): Observable<GratuityResponse> {
    return this.unwrap(this.http.get<ApiResponse<GratuityResponse>>(`${this.base}/${id}`));
  }

  nextCode(): Observable<string> {
    return this.unwrap(this.http.get<ApiResponse<string>>(`${this.base}/next-code`));
  }

  create(req: GratuityRequest): Observable<GratuityResponse> {
    return this.unwrap(this.http.post<ApiResponse<GratuityResponse>>(this.base, req));
  }

  update(id: number, req: GratuityRequest): Observable<GratuityResponse> {
    return this.unwrap(this.http.put<ApiResponse<GratuityResponse>>(`${this.base}/${id}`, req));
  }

  delete(id: number): Observable<void> {
    return this.unwrap(this.http.delete<ApiResponse<void>>(`${this.base}/${id}`));
  }

  approve(id: number): Observable<GratuityResponse> {
    return this.unwrap(this.http.post<ApiResponse<GratuityResponse>>(`${this.base}/${id}/approve`, {}));
  }

  markPaid(id: number): Observable<GratuityResponse> {
    return this.unwrap(this.http.post<ApiResponse<GratuityResponse>>(`${this.base}/${id}/pay`, {}));
  }

  cancel(id: number): Observable<GratuityResponse> {
    return this.unwrap(this.http.post<ApiResponse<GratuityResponse>>(`${this.base}/${id}/cancel`, {}));
  }
}
