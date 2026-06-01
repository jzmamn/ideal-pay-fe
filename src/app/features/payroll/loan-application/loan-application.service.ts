import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';

// ── Loan type (master) ────────────────────────────────────────────────────

export interface LoanType {
  id:          number;
  code:        string;
  name:        string;
  isActive:    string;
  description: string;
  amount:      number;
}

// ── Employee loan application ─────────────────────────────────────────────

export interface LoanApplicationRequest {
  empId:         number;
  loanId:        number;
  amount:        number;
  payrollMonth:  string;
  isProcessed?:  boolean;
  processedDate?: string;
  createdBy:     number;
  modifiedBy:    number;
}

export interface LoanApplicationResponse {
  id:             number;
  amount:         number;
  payrollMonth:   string;
  isProcessed:    boolean;
  processedDate:  string | null;

  empId:          number;
  empCode:        string;
  empName:        string;

  loanId:         number;
  loanCode:       string;
  loanName:       string;

  createdById:        number;
  createdByCode:      string;
  createdByUserName:  string;
  createdDate:        string;
  modifiedById:       number;
  modifiedByCode:     string;
  modifiedByUserName: string;
  modifiedDate:       string;
}

// ── Service ───────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class LoanApplicationService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/emp-loan`;
  private readonly typesUrl= `${inject(API_BASE_URL)}/loan-types`;

  getLoanTypes(): Observable<LoanType[]> {
    return this.http
      .get<ApiResponse<LoanType[]>>(`${this.typesUrl}?showDefaultRow=false`)
      .pipe(map(r => r.data));
  }

  getAll(): Observable<LoanApplicationResponse[]> {
    return this.http
      .get<ApiResponse<LoanApplicationResponse[]>>(`${this.baseUrl}?showDefaultRow=false`)
      .pipe(map(r => r.data));
  }

  getByEmployee(empId: number): Observable<LoanApplicationResponse[]> {
    return this.http
      .get<ApiResponse<LoanApplicationResponse[]>>(`${this.baseUrl}/employee/${empId}`)
      .pipe(map(r => r.data));
  }

  getByMonth(payrollMonth: string): Observable<LoanApplicationResponse[]> {
    return this.http
      .get<ApiResponse<LoanApplicationResponse[]>>(`${this.baseUrl}/month/${payrollMonth}`)
      .pipe(map(r => r.data));
  }

  create(body: LoanApplicationRequest): Observable<LoanApplicationResponse> {
    return this.http
      .post<ApiResponse<LoanApplicationResponse>>(this.baseUrl, body)
      .pipe(map(r => r.data));
  }

  update(id: number, body: LoanApplicationRequest): Observable<LoanApplicationResponse> {
    return this.http
      .put<ApiResponse<LoanApplicationResponse>>(`${this.baseUrl}/${id}`, body)
      .pipe(map(r => r.data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
