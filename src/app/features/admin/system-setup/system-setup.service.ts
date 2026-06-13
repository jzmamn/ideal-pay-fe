import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { SystemSetup, SystemSetupUpdate } from './system-setup.model';

@Injectable({ providedIn: 'root' })
export class SystemSetupService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/system-setup`;

  getAll(): Observable<ApiResponse<SystemSetup[]>> {
    return this.http.get<ApiResponse<SystemSetup[]>>(this.url);
  }

  update(id: number, update: SystemSetupUpdate): Observable<ApiResponse<SystemSetup>> {
    return this.http.put<ApiResponse<SystemSetup>>(`${this.url}/${id}`, update);
  }
}
