import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { EmployeeType } from '../../../shared/models/master-data.models';

interface ApiEmployeeType {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdBy: number;
  createdDate: string | null;
  modifiedBy: number;
  modifiedDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

type ApiEmployeeTypePayload = Pick<ApiEmployeeType, 'code' | 'name' | 'description' | 'isActive'>;

@Injectable({ providedIn: 'root' })
export class EmployeeTypeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/emp-type`;

  getAll(): Observable<EmployeeType[]> {
    return this.http.get<ApiResponse<ApiEmployeeType[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getAllActive(): Observable<EmployeeType[]> {
    return this.http.get<ApiResponse<ApiEmployeeType[]>>(this.baseUrl, { params: { isActive: 'true' } }).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getById(id: number): Observable<EmployeeType> {
    return this.http.get<ApiResponse<ApiEmployeeType>>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  create(data: Omit<EmployeeType, 'id'>): Observable<EmployeeType> {
    const payload: ApiEmployeeTypePayload = {
      code:        data.code,
      name:        data.name,
      description: data.description ?? null,
      isActive:    data.isActive,
    };
    return this.http.post<ApiResponse<ApiEmployeeType>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: EmployeeType): Observable<void> {
    const payload: ApiEmployeeTypePayload = {
      code:        data.code,
      name:        data.name,
      description: data.description ?? null,
      isActive:    data.isActive,
    };
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toModel(item: ApiEmployeeType): EmployeeType {
    return {
      id:          item.id,
      code:        item.code,
      name:        item.name,
      description: item.description ?? undefined,
      isActive:    item.isActive,
    };
  }
}
