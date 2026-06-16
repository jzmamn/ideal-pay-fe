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
  description: string | null;
  isActive: boolean;
  createdById: number;
  createdDate: string | null;
  modifiedById: number;
  modifiedDate: string | null;
}

interface DepartmentPayload {
  name: string;
  description: string | null;
  isActive: boolean;
}

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
    const payload: DepartmentPayload = {
      name:        data.name,
      description: (data as { description?: string }).description ?? null,
      isActive:    data.isActive,
    };
    return this.http.post<ApiResponse<ApiDepartment>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: Department): Observable<void> {
    const payload: DepartmentPayload = {
      name:        data.name,
      description: (data as { description?: string }).description ?? null,
      isActive:    data.isActive,
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
