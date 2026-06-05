import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';

export interface EmailConfigResponse {
  id         : number;
  name       : string;
  host       : string;
  port       : number;
  username   : string;
  fromName   : string;
  fromAddress: string;
  useTls     : boolean;
  isActive   : boolean;
}

export interface EmailConfigRequest {
  name       : string;
  host       : string;
  port       : number;
  username   : string;
  /** Leave blank on update to keep existing password. */
  password   : string;
  fromName   : string;
  fromAddress: string;
  useTls     : boolean;
}

@Injectable({ providedIn: 'root' })
export class EmailSettingsService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/email-config`;

  getAll(): Observable<EmailConfigResponse[]> {
    return this.http
      .get<ApiResponse<EmailConfigResponse[]>>(this.baseUrl)
      .pipe(map(r => r.data));
  }

  getActive(): Observable<EmailConfigResponse> {
    return this.http
      .get<ApiResponse<EmailConfigResponse>>(`${this.baseUrl}/active`)
      .pipe(map(r => r.data));
  }

  create(req: EmailConfigRequest): Observable<EmailConfigResponse> {
    return this.http
      .post<ApiResponse<EmailConfigResponse>>(`${this.baseUrl}?userId=1`, req)
      .pipe(map(r => r.data));
  }

  update(id: number, req: EmailConfigRequest): Observable<EmailConfigResponse> {
    return this.http
      .put<ApiResponse<EmailConfigResponse>>(`${this.baseUrl}/${id}?userId=1`, req)
      .pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  activate(id: number): Observable<EmailConfigResponse> {
    return this.http
      .patch<ApiResponse<EmailConfigResponse>>(`${this.baseUrl}/${id}/activate?userId=1`, null)
      .pipe(map(r => r.data));
  }

  deactivate(id: number): Observable<EmailConfigResponse> {
    return this.http
      .patch<ApiResponse<EmailConfigResponse>>(`${this.baseUrl}/${id}/deactivate?userId=1`, null)
      .pipe(map(r => r.data));
  }

  testConnection(): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<ApiResponse<{ success: boolean; message: string }>>(`${this.baseUrl}/test`, null)
      .pipe(map(r => r.data));
  }

  testById(id: number): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<ApiResponse<{ success: boolean; message: string }>>(`${this.baseUrl}/${id}/test`, null)
      .pipe(map(r => r.data));
  }
}
