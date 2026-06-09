import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import type { EmployeeResponse } from './employee.model';
import type {
  EmployeeFixedAllowanceRequest,
  EmployeeFixedAllowanceResponse,
} from './employee-fixed-allowance/employee-fixed-allowance.model';
import type {
  EmployeeFixedDeductionRequest,
  EmployeeFixedDeductionResponse,
} from './employee-fixed-deduction/employee-fixed-deduction.model';
import type {
  EmployeePayrollComponentsResponse,
  EmployeeProfileSaveRequest,
  EmployeeVariableAllowanceRequest,
  EmployeeVariableAllowanceResponse,
  EmployeeLateResponse,
  EmployeeLateRequest,
  EmployeeVariableDeductionRequest,
  EmployeeVariableDeductionResponse,
  EmployeeNopayRequest,
  EmployeeNopayResponse,
  EmployeeOvertimeRequest,
  EmployeeOvertimeResponse,
} from './employee-profile.model';

export type {
  EmployeePayrollComponentsResponse,
  EmployeeProfileSaveRequest,
  EmployeeVariableAllowanceRequest,
  EmployeeVariableAllowanceResponse,
  EmployeeLateResponse,
  EmployeeLateRequest,
  EmployeeVariableDeductionRequest,
  EmployeeVariableDeductionResponse,
  EmployeeNopayRequest,
  EmployeeNopayResponse,
  EmployeeOvertimeRequest,
  EmployeeOvertimeResponse,
} from './employee-profile.model';

@Injectable({ providedIn: 'root' })
export class EmployeeProfileService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  // ── Employee ──────────────────────────────────────────────────────────────

  getAllEmployees(isActive?: string): Observable<EmployeeResponse[]> {
    let params = new HttpParams();
    if (isActive) params = params.set('isActive', isActive);
    return this.http.get<ApiResponse<EmployeeResponse[]>>(`${this.base}/employee`, { params })
      .pipe(map(r => r.data));
  }

  getEmployeeById(id: number): Observable<EmployeeResponse> {
    return this.http.get<ApiResponse<EmployeeResponse>>(`${this.base}/employee/${id}`)
      .pipe(map(r => r.data));
  }

  // ── Employee Payroll Components (profile) ─────────────────────────────────

  getEmployeeProfile(): Observable<EmployeePayrollComponentsResponse> {
    return this.http.get<ApiResponse<EmployeePayrollComponentsResponse>>(`${this.base}/emp-profile/`)
      .pipe(map(r => r.data));
  }

  getEmployeeProfileByEmployee(empId: number, assignedOnly = false): Observable<EmployeePayrollComponentsResponse> {
    const params = new HttpParams().set('assignedOnly', String(assignedOnly));
    return this.http.get<ApiResponse<EmployeePayrollComponentsResponse>>(`${this.base}/emp-profile/${empId}`, { params })
      .pipe(map(r => r.data));
  }

  saveEmployeeProfile(empId: number, payload: EmployeeProfileSaveRequest): Observable<EmployeePayrollComponentsResponse> {
    return this.http.post<ApiResponse<EmployeePayrollComponentsResponse>>(`${this.base}/emp-profile/${empId}`, payload)
      .pipe(map(r => r.data));
  }

  // ── Fixed Allowances ──────────────────────────────────────────────────────

  getFixedAllowances(): Observable<EmployeeFixedAllowanceResponse[]> {
    return this.http.get<ApiResponse<EmployeeFixedAllowanceResponse[]>>(`${this.base}/emp-fa`)
      .pipe(map(r => r.data));
  }

  getFixedAllowancesByEmployee(empId: number): Observable<EmployeeFixedAllowanceResponse[]> {
    return this.http.get<ApiResponse<EmployeeFixedAllowanceResponse[]>>(`${this.base}/emp-fa/employee/${empId}`)
      .pipe(map(r => r.data));
  }

  createFixedAllowance(payload: EmployeeFixedAllowanceRequest): Observable<EmployeeFixedAllowanceResponse> {
    return this.http.post<ApiResponse<EmployeeFixedAllowanceResponse>>(`${this.base}/emp-fa`, payload)
      .pipe(map(r => r.data));
  }

  updateFixedAllowance(id: number, payload: EmployeeFixedAllowanceRequest): Observable<EmployeeFixedAllowanceResponse> {
    return this.http.put<ApiResponse<EmployeeFixedAllowanceResponse>>(`${this.base}/emp-fa/${id}`, payload)
      .pipe(map(r => r.data));
  }

  deleteFixedAllowance(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/emp-fa/${id}`)
      .pipe(map(r => r.data));
  }

  // ── Fixed Deductions ──────────────────────────────────────────────────────

  getFixedDeductions(): Observable<EmployeeFixedDeductionResponse[]> {
    return this.http.get<ApiResponse<EmployeeFixedDeductionResponse[]>>(`${this.base}/emp-fd`)
      .pipe(map(r => r.data));
  }

  getFixedDeductionsByEmployee(empId: number): Observable<EmployeeFixedDeductionResponse[]> {
    return this.http.get<ApiResponse<EmployeeFixedDeductionResponse[]>>(`${this.base}/emp-fd/employee/${empId}`)
      .pipe(map(r => r.data));
  }

  createFixedDeduction(payload: EmployeeFixedDeductionRequest): Observable<EmployeeFixedDeductionResponse> {
    return this.http.post<ApiResponse<EmployeeFixedDeductionResponse>>(`${this.base}/emp-fd`, payload)
      .pipe(map(r => r.data));
  }

  updateFixedDeduction(id: number, payload: EmployeeFixedDeductionRequest): Observable<EmployeeFixedDeductionResponse> {
    return this.http.put<ApiResponse<EmployeeFixedDeductionResponse>>(`${this.base}/emp-fd/${id}`, payload)
      .pipe(map(r => r.data));
  }

  deleteFixedDeduction(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/emp-fd/${id}`)
      .pipe(map(r => r.data));
  }

  // ── Variable Allowances ───────────────────────────────────────────────────

  getVariableAllowances(): Observable<EmployeeVariableAllowanceResponse[]> {
    return this.http.get<ApiResponse<EmployeeVariableAllowanceResponse[]>>(`${this.base}/emp-va`)
      .pipe(map(r => r.data));
  }

  getVariableAllowancesByEmployee(empId: number): Observable<EmployeeVariableAllowanceResponse[]> {
    return this.http.get<ApiResponse<EmployeeVariableAllowanceResponse[]>>(`${this.base}/emp-va/employee/${empId}`)
      .pipe(map(r => r.data));
  }

  createVariableAllowance(payload: EmployeeVariableAllowanceRequest): Observable<EmployeeVariableAllowanceResponse> {
    return this.http.post<ApiResponse<EmployeeVariableAllowanceResponse>>(`${this.base}/emp-va`, payload)
      .pipe(map(r => r.data));
  }

  updateVariableAllowance(id: number, payload: EmployeeVariableAllowanceRequest): Observable<EmployeeVariableAllowanceResponse> {
    return this.http.put<ApiResponse<EmployeeVariableAllowanceResponse>>(`${this.base}/emp-va/${id}`, payload)
      .pipe(map(r => r.data));
  }

  deleteVariableAllowance(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/emp-va/${id}`)
      .pipe(map(r => r.data));
  }

  // ── Variable Deductions ───────────────────────────────────────────────────

  getVariableDeductions(): Observable<EmployeeVariableDeductionResponse[]> {
    return this.http.get<ApiResponse<EmployeeVariableDeductionResponse[]>>(`${this.base}/emp-vd`)
      .pipe(map(r => r.data));
  }

  getVariableDeductionsByEmployee(empId: number): Observable<EmployeeVariableDeductionResponse[]> {
    return this.http.get<ApiResponse<EmployeeVariableDeductionResponse[]>>(`${this.base}/emp-vd/employee/${empId}`)
      .pipe(map(r => r.data));
  }

  createVariableDeduction(payload: EmployeeVariableDeductionRequest): Observable<EmployeeVariableDeductionResponse> {
    return this.http.post<ApiResponse<EmployeeVariableDeductionResponse>>(`${this.base}/emp-vd`, payload)
      .pipe(map(r => r.data));
  }

  updateVariableDeduction(id: number, payload: EmployeeVariableDeductionRequest): Observable<EmployeeVariableDeductionResponse> {
    return this.http.put<ApiResponse<EmployeeVariableDeductionResponse>>(`${this.base}/emp-vd/${id}`, payload)
      .pipe(map(r => r.data));
  }

  deleteVariableDeduction(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/emp-vd/${id}`)
      .pipe(map(r => r.data));
  }

  // ── Nopay ─────────────────────────────────────────────────────────────────

  getNopays(): Observable<EmployeeNopayResponse[]> {
    return this.http.get<ApiResponse<EmployeeNopayResponse[]>>(`${this.base}/emp-np`)
      .pipe(map(r => r.data));
  }

  createNopay(payload: EmployeeNopayRequest): Observable<EmployeeNopayResponse> {
    return this.http.post<ApiResponse<EmployeeNopayResponse>>(`${this.base}/emp-np`, payload)
      .pipe(map(r => r.data));
  }

  updateNopay(id: number, payload: EmployeeNopayRequest): Observable<EmployeeNopayResponse> {
    return this.http.put<ApiResponse<EmployeeNopayResponse>>(`${this.base}/emp-np/${id}`, payload)
      .pipe(map(r => r.data));
  }

  deleteNopay(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/emp-np/${id}`)
      .pipe(map(r => r.data));
  }

  // ── Overtime ──────────────────────────────────────────────────────────────

  getOvertimes(): Observable<EmployeeOvertimeResponse[]> {
    return this.http.get<ApiResponse<EmployeeOvertimeResponse[]>>(`${this.base}/emp-ot`)
      .pipe(map(r => r.data));
  }

  createOvertime(payload: EmployeeOvertimeRequest): Observable<EmployeeOvertimeResponse> {
    return this.http.post<ApiResponse<EmployeeOvertimeResponse>>(`${this.base}/emp-ot`, payload)
      .pipe(map(r => r.data));
  }

  updateOvertime(id: number, payload: EmployeeOvertimeRequest): Observable<EmployeeOvertimeResponse> {
    return this.http.put<ApiResponse<EmployeeOvertimeResponse>>(`${this.base}/emp-ot/${id}`, payload)
      .pipe(map(r => r.data));
  }

  deleteOvertime(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/emp-ot/${id}`)
      .pipe(map(r => r.data));
  }

  // ── Late ──────────────────────────────────────────────────────────────────

  getLatesByEmployee(empId: number): Observable<EmployeeLateResponse[]> {
    return this.http.get<ApiResponse<EmployeeLateResponse[]>>(`${this.base}/emp-late/employee/${empId}`)
      .pipe(map(r => r.data));
  }

  saveLate(payload: EmployeeLateRequest): Observable<EmployeeLateResponse> {
    if (payload.id && payload.id > 0) {
      return this.http.put<ApiResponse<EmployeeLateResponse>>(`${this.base}/emp-late/${payload.id}`, payload)
        .pipe(map(r => r.data));
    }
    return this.http.post<ApiResponse<EmployeeLateResponse>>(`${this.base}/emp-late`, payload)
      .pipe(map(r => r.data));
  }

  deleteLate(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/emp-late/${id}`)
      .pipe(map(r => r.data));
  }
}
