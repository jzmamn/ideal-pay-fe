import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../../../../api-url.token';
import { ApiResponse } from '../../../../../../shared/models/api-response.model';
import { EmployeeBonusRequest, EmployeeBonusResponse } from './employee-bonus.model';

@Injectable({ providedIn: 'root' })
export class EmployeeBonusService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/emp-bonus`;

  getByEmployee(empId: number): Observable<EmployeeBonusResponse[]> {
    return this.http
      .get<ApiResponse<EmployeeBonusResponse[]>>(`${this.baseUrl}/employee/${empId}`)
      .pipe(map(res => res.data));
  }

  getById(id: number): Observable<EmployeeBonusResponse> {
    return this.http
      .get<ApiResponse<EmployeeBonusResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  create(data: EmployeeBonusRequest): Observable<EmployeeBonusResponse> {
    return this.http
      .post<ApiResponse<EmployeeBonusResponse>>(this.baseUrl, data)
      .pipe(map(res => res.data));
  }

  update(id: number, data: EmployeeBonusRequest): Observable<EmployeeBonusResponse> {
    return this.http
      .put<ApiResponse<EmployeeBonusResponse>>(`${this.baseUrl}/${id}`, data)
      .pipe(map(res => res.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
