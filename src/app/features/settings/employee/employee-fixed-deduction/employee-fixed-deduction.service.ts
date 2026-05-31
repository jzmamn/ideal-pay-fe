import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject, catchError, map, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { API_BASE_URL } from '../../../../api-url.token';
import { ApiResponse } from '../../../../shared/models/api-response.model';
import { EmployeeFixedDeductionRequest, EmployeeFixedDeductionResponse } from './employee-fixed-deduction.model';

@Injectable({ providedIn: 'root' })
export class EmployeeFixedDeductionService {
  private readonly http     = inject(HttpClient);
  private readonly baseUrl  = `${inject(API_BASE_URL)}/emp-fd`;
  private readonly refresh$ = new Subject<void>();

  private readonly _selected = signal<EmployeeFixedDeductionResponse | null>(null);
  readonly selected = this._selected.asReadonly();

  readonly items = toSignal(
    this.refresh$.pipe(
      switchMap(() =>
        this.http.get<ApiResponse<EmployeeFixedDeductionResponse[]>>(this.baseUrl).pipe(
          map(res => res.data),
          catchError(() => of([] as EmployeeFixedDeductionResponse[])),
        ),
      ),
    ),
    { initialValue: [] as EmployeeFixedDeductionResponse[] },
  );

  reload(): void {
    this.refresh$.next();
  }

  select(item: EmployeeFixedDeductionResponse): void {
    this._selected.set(item);
  }

  clearSelection(): void {
    this._selected.set(null);
  }

  getByEmployee(empId: number): Observable<EmployeeFixedDeductionResponse[]> {
    return this.http
      .get<ApiResponse<EmployeeFixedDeductionResponse[]>>(`${this.baseUrl}/employee/${empId}`)
      .pipe(map(res => res.data));
  }

  getById(id: number): Observable<EmployeeFixedDeductionResponse> {
    return this.http
      .get<ApiResponse<EmployeeFixedDeductionResponse>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => res.data));
  }

  create(data: EmployeeFixedDeductionRequest): Observable<EmployeeFixedDeductionResponse> {
    return this.http
      .post<ApiResponse<EmployeeFixedDeductionResponse>>(this.baseUrl, data)
      .pipe(map(res => res.data));
  }

  update(id: number, data: EmployeeFixedDeductionRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
