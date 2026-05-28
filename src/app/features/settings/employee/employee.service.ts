import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject, catchError, map, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { EmployeeRequest, EmployeeResponse } from './employee.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http     = inject(HttpClient);
  private readonly baseUrl  = `${inject(API_BASE_URL)}/employee`;
  private readonly refresh$ = new Subject<void>();

  private readonly _selected = signal<EmployeeResponse | null>(null);
  readonly selected = this._selected.asReadonly();

  readonly employees = toSignal(
    this.refresh$.pipe(
      switchMap(() =>
        this.http.get<ApiResponse<EmployeeResponse[]>>(this.baseUrl).pipe(
          map(res => res.data),
          catchError(() => of([] as EmployeeResponse[])),
        ),
      ),
    ),
    { initialValue: [] as EmployeeResponse[] },
  );

  reload(): void {
    this.refresh$.next();
  }

  select(emp: EmployeeResponse): void {
    this._selected.set(emp);
  }

  clearSelection(): void {
    this._selected.set(null);
  }

  create(data: EmployeeRequest): Observable<EmployeeResponse> {
    return this.http.post<ApiResponse<EmployeeResponse>>(this.baseUrl, data).pipe(
      map(res => res.data),
    );
  }

  update(id: number, data: EmployeeRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
