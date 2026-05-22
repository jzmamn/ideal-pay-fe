import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject, catchError, map, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { EmployeeModel } from './employee.model';

export type EmployeePayload = Omit<EmployeeModel, 'id' | 'createdBy' | 'createdDate' | 'modifiedBy' | 'modifiedDate'>;

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private readonly http     = inject(HttpClient);
  private readonly baseUrl  = `${inject(API_BASE_URL)}/employee`;
  private readonly refresh$ = new Subject<void>();

  private readonly _selected = signal<EmployeeModel | null>(null);
  readonly selected = this._selected.asReadonly();

  readonly employees = toSignal(
    this.refresh$.pipe(
      switchMap(() =>
        this.http.get<ApiResponse<EmployeeModel[]>>(this.baseUrl).pipe(
          map(res => res.data),
          catchError(() => of([] as EmployeeModel[])),
        ),
      ),
    ),
    { initialValue: [] as EmployeeModel[] },
  );

  reload(): void {
    this.refresh$.next();
  }

  select(emp: EmployeeModel): void {
    this._selected.set(emp);
  }

  clearSelection(): void {
    this._selected.set(null);
  }

  create(data: EmployeePayload): Observable<EmployeeModel> {
    return this.http.post<ApiResponse<EmployeeModel>>(this.baseUrl, data).pipe(
      map(res => res.data),
    );
  }

  update(id: number, data: EmployeePayload): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
