import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { Designation } from '../../../shared/models/master-data.models';

interface ApiDesignation {
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

type ApiDesignationPayload = Pick<ApiDesignation, 'code' | 'name' | 'isActive'>;

@Injectable({ providedIn: 'root' })
export class DesignationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/designation`;

  getAll(): Observable<Designation[]> {
    return this.http.get<ApiResponse<ApiDesignation[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getAllActive(): Observable<Designation[]> {
    return this.http.get<ApiResponse<ApiDesignation[]>>(this.baseUrl, { params: { isActive: 'true' } }).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getById(id: number): Observable<Designation> {
    return this.http.get<ApiResponse<ApiDesignation>>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  create(data: Omit<Designation, 'id'>): Observable<Designation> {
    const payload: ApiDesignationPayload = {
      code:     data.code,
      name:     data.name,
      isActive: data.isActive,
    };
    return this.http.post<ApiResponse<ApiDesignation>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: Designation): Observable<void> {
    const payload: ApiDesignationPayload = {
      code:     data.code,
      name:     data.name,
      isActive: data.isActive,
    };
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toModel(item: ApiDesignation): Designation {
    return {
      id:       item.id,
      code:     item.code,
      name:     item.name,
      isActive: item.isActive,
    };
  }
}
