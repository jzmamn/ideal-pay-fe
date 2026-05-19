import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { Department } from '../../../shared/models/master-data.models';

interface ApiDepartment {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  createdBy: number;
  createdDate: string | null;
  modifiedBy: number;
  modifiedDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

type ApiDepartmentPayload = Pick<ApiDepartment, 'code' | 'name' | 'isActive'>;

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/department`;

  getAll(): Observable<Department[]> {
    return this.http.get<ApiResponse<ApiDepartment[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getById(id: number): Observable<Department> {
    return this.http.get<ApiResponse<ApiDepartment>>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  create(data: Omit<Department, 'id'>): Observable<Department> {
    const payload: ApiDepartmentPayload = {
      code:     data.code,
      name:     data.name,
      isActive: data.isActive,
    };
    return this.http.post<ApiResponse<ApiDepartment>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: Department): Observable<void> {
    const payload: ApiDepartmentPayload = {
      code:     data.code,
      name:     data.name,
      isActive: data.isActive,
    };
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toModel(item: ApiDepartment): Department {
    return {
      id:       item.id,
      code:     item.code,
      name:     item.name,
      isActive: item.isActive,
    };
  }
}
