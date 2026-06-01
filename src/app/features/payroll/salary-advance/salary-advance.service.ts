import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';

export interface EmployeeSalaryAdvanceRequest {
  empId: number;
  amount: number;
  payrollMonth: string;
  isProcessed?: boolean;
  processedDate?: string;
  createdBy: number;
  modifiedBy: number;
}

export interface EmployeeSalaryAdvanceResponse {
  id: number;
  amount: number;
  payrollMonth: string;
  isProcessed: boolean;
  processedDate: string | null;

  empId: number;
  empCode: string;
  empName: string;

  createdById: number;
  createdByCode: string;
  createdByUserName: string;
  createdDate: string;
  modifiedById: number;
  modifiedByCode: string;
  modifiedByUserName: string;
  modifiedDate: string;
}

@Injectable({ providedIn: 'root' })
export class SalaryAdvanceService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/emp-sal-adv`;

  getAll(): Observable<EmployeeSalaryAdvanceResponse[]> {
    return this.http
      .get<ApiResponse<EmployeeSalaryAdvanceResponse[]>>(`${this.baseUrl}?showDefaultRow=false`)
      .pipe(map(r => r.data));
  }

  getByMonth(payrollMonth: string): Observable<EmployeeSalaryAdvanceResponse[]> {
    return this.http
      .get<ApiResponse<EmployeeSalaryAdvanceResponse[]>>(`${this.baseUrl}/month/${payrollMonth}`)
      .pipe(map(r => r.data));
  }

  getByEmployee(empId: number): Observable<EmployeeSalaryAdvanceResponse[]> {
    return this.http
      .get<ApiResponse<EmployeeSalaryAdvanceResponse[]>>(`${this.baseUrl}/employee/${empId}`)
      .pipe(map(r => r.data));
  }

  create(body: EmployeeSalaryAdvanceRequest): Observable<EmployeeSalaryAdvanceResponse> {
    return this.http
      .post<ApiResponse<EmployeeSalaryAdvanceResponse>>(this.baseUrl, body)
      .pipe(map(r => r.data));
  }

  update(id: number, body: EmployeeSalaryAdvanceRequest): Observable<EmployeeSalaryAdvanceResponse> {
    return this.http
      .put<ApiResponse<EmployeeSalaryAdvanceResponse>>(`${this.baseUrl}/${id}`, body)
      .pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
