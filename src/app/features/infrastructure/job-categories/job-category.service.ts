import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { JobCategory } from '../../../shared/models/master-data.models';

interface ApiJobCategory {
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

type ApiJobCategoryPayload = Pick<ApiJobCategory, 'code' | 'name' | 'description' | 'isActive'>;

@Injectable({ providedIn: 'root' })
export class JobCategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/job-category`;

  getAll(): Observable<JobCategory[]> {
    return this.http.get<ApiResponse<ApiJobCategory[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getAllActive(): Observable<JobCategory[]> {
    return this.http.get<ApiResponse<ApiJobCategory[]>>(this.baseUrl, { params: { isActive: 'true' } }).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getById(id: number): Observable<JobCategory> {
    return this.http.get<ApiResponse<ApiJobCategory>>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  create(data: Omit<JobCategory, 'id'>): Observable<JobCategory> {
    const payload: ApiJobCategoryPayload = {
      code:        data.code,
      name:        data.name,
      description: data.description ?? null,
      isActive:    data.isActive,
    };
    return this.http.post<ApiResponse<ApiJobCategory>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: JobCategory): Observable<void> {
    const payload: ApiJobCategoryPayload = {
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

  private toModel(item: ApiJobCategory): JobCategory {
    return {
      id:          item.id,
      code:        item.code,
      name:        item.name,
      description: item.description ?? undefined,
      isActive:    item.isActive,
    };
  }
}
