import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { EmployeeStatus } from '../../../shared/models/master-data.models';

interface ApiStatus {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  dateOnly: boolean;
}

@Injectable({ providedIn: 'root' })
export class StatusService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/status`;

  getActive(): Observable<EmployeeStatus[]> {
    return this.http
      .get<ApiResponse<ApiStatus[]>>(this.baseUrl, {
        params: { isActive: 'true', showDefaultRow: 'false' },
      })
      .pipe(
        map(res => res.data.map(item => ({
          id:           item.id,
          code:         item.code,
          name:         item.name,
          isActive:     item.isActive,
          dateOnly: item.dateOnly ?? false,
        }))),
      );
  }
}
