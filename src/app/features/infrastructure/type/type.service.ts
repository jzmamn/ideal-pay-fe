import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { EmployeeType } from '../../../shared/models/master-data.models';
import { TypeRequest, TypeResponse } from './type.model';

@Injectable({ providedIn: 'root' })
export class EmployeeTypeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/type`;

  getAll(): Observable<EmployeeType[]> {
    return this.http.get<ApiResponse<TypeResponse[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getAllActive(): Observable<EmployeeType[]> {
    return this.http.get<ApiResponse<TypeResponse[]>>(this.baseUrl, { params: { isActive: 'true' } }).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getById(id: number): Observable<EmployeeType> {
    return this.http.get<ApiResponse<TypeResponse>>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  create(data: Omit<EmployeeType, 'id'>): Observable<EmployeeType> {
    const payload: TypeRequest = {
      name:        data.name,
      description: data.description ?? '',
      isActive:    data.isActive,
      isDateRange: data.dateRange,
      createdBy:   1,
      modifiedBy:  1,
    };
    return this.http.post<ApiResponse<TypeResponse>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: EmployeeType): Observable<void> {
    const payload: TypeRequest = {
      name:        data.name,
      description: data.description ?? '',
      isActive:    data.isActive,
      isDateRange: data.dateRange,
      createdBy:   1,
      modifiedBy:  1,
    };
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toModel(item: TypeResponse): EmployeeType {
    return {
      id:          item.id,
      code:        item.code,
      name:        item.name,
      description: item.description || undefined,
      isActive:    item.isActive,
      dateRange:   item.isDateRange,
    };
  }
}
