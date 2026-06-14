import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../../../../api-url.token';
import { ApiResponse } from '../../../../../../shared/models/api-response.model';
import { EmployeeOvertimeRequest, EmployeeOvertimeResponse } from './employee-overtime.model';

@Injectable({ providedIn: 'root' })
export class EmployeeOvertimeService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/emp-ot`;

  /**
   * Loads all overtime records for a single employee in the given pay period.
   * Returns an entry per active OT type, each with the formula-derived rate.
   */
  getByEmployee(empId: number, payrollMonth: string): Observable<EmployeeOvertimeResponse[]> {
    return this.http
      .get<ApiResponse<EmployeeOvertimeResponse[]>>(
        `${this.baseUrl}/by-employee`,
        { params: { empId: String(empId), payrollMonth } },
      )
      .pipe(map(res => res.data));
  }

  /**
   * Updates overtime hours for an existing record.
   * The server computes amount = rate × hours; clients must not send amount.
   */
  update(id: number, data: EmployeeOvertimeRequest): Observable<EmployeeOvertimeResponse> {
    return this.http
      .put<ApiResponse<EmployeeOvertimeResponse>>(`${this.baseUrl}/${id}`, data)
      .pipe(map(res => res.data));
  }
}
