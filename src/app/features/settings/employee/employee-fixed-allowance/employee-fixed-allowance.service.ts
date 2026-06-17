import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject, catchError, map, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { API_BASE_URL } from '../../../../api-url.token';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import {
  EmployeeFixedAllowancePreviewResult,
  EmployeeFixedAllowanceRequest,
  EmployeeFixedAllowanceResponse,
} from './employee-fixed-allowance.model';

@Injectable({ providedIn: 'root' })
export class EmployeeFixedAllowanceService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/emp-fa`;
  private readonly refresh$ = new Subject<void>();

  private readonly _selected = signal<EmployeeFixedAllowanceResponse | null>(null);
  readonly selected = this._selected.asReadonly();

  readonly items = toSignal(
    this.refresh$.pipe(
      switchMap(() =>
        this.http.get<ApiResponse<EmployeeFixedAllowanceResponse[]>>(this.baseUrl).pipe(
          map(res => res.data),
          catchError(() => of([] as EmployeeFixedAllowanceResponse[])),
        ),
      ),
    ),
    { initialValue: [] as EmployeeFixedAllowanceResponse[] },
  );

  reload(): void {
    this.refresh$.next();
  }

  select(item: EmployeeFixedAllowanceResponse): void {
    this._selected.set(item);
  }

  clearSelection(): void {
    this._selected.set(null);
  }

  getByEmployee(empId: number): Observable<EmployeeFixedAllowanceResponse[]> {
    return this.http
      .get<ApiResponse<EmployeeFixedAllowanceResponse[]>>(`${this.baseUrl}/employee/${empId}`)
      .pipe(map(res => res.data));
  }

  getById(id: number): Observable<EmployeeFixedAllowanceResponse> {
    return this.http
      .get<ApiResponse<EmployeeFixedAllowanceResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  create(data: EmployeeFixedAllowanceRequest): Observable<EmployeeFixedAllowanceResponse> {
    return this.http
      .post<ApiResponse<EmployeeFixedAllowanceResponse>>(this.baseUrl, data)
      .pipe(map(res => res.data));
  }

  update(id: number, data: EmployeeFixedAllowanceRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Employee → Salary Tab → Fixed Allowance checkbox grid: computes the amount this employee
   * would receive for the given Fixed Allowance (formula evaluated server-side against the
   * employee's basicSalary + the payroll month's working days, or the static fallback amount).
   * Called the instant a row's checkbox is checked.
   */
  previewAmount(empId: number, faId: number, payrollMonth: string): Observable<EmployeeFixedAllowancePreviewResult> {
    const params = new HttpParams().set('faId', faId).set('payrollMonth', payrollMonth);
    return this.http
      .get<ApiResponse<EmployeeFixedAllowancePreviewResult>>(`${this.baseUrl}/employee/${empId}/preview-amount`, { params })
      .pipe(map(res => res.data));
  }
}
