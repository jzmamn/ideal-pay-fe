import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';

export interface EmailConfigResponse {
  id         : number;
  host       : string;
  port       : number;
  username   : string;
  fromName   : string;
  fromAddress: string;
  useTls     : boolean;
  isActive   : boolean;
}

export interface EmailConfigRequest {
  host       : string;
  port       : number;
  username   : string;
  password   : string;
  fromName   : string;
  fromAddress: string;
  useTls     : boolean;
}

@Injectable({ providedIn: 'root' })
export class EmailSettingsService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/email-config`;

  get(): Observable<EmailConfigResponse> {
    return this.http
      .get<ApiResponse<EmailConfigResponse>>(this.baseUrl)
      .pipe(map(r => r.data));
  }

  save(req: EmailConfigRequest): Observable<EmailConfigResponse> {
    return this.http
      .post<ApiResponse<EmailConfigResponse>>(this.baseUrl, req)
      .pipe(map(r => r.data));
  }

  testConnection(): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<ApiResponse<{ success: boolean; message: string }>>(`${this.baseUrl}/test`, null)
      .pipe(map(r => r.data));
  }
}
