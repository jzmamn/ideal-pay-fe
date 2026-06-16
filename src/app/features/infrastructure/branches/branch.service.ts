import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { Branch } from '../../../shared/models/master-data.models';

interface ApiBranch {
  id: number;
  code: string;
  name: string;
  description: string | null;
  location: string | null;
  isActive: boolean;
  createdById: number;
  createdDate: string | null;
  modifiedById: number;
  modifiedDate: string | null;
}

interface BranchPayload {
  name: string;
  description: string | null;
  location: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class BranchService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/branch`;

  getAll(): Observable<Branch[]> {
    return this.http.get<ApiResponse<ApiBranch[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getAllActive(): Observable<Branch[]> {
    return this.http.get<ApiResponse<ApiBranch[]>>(this.baseUrl, { params: { isActive: 'true' } }).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getById(id: number): Observable<Branch> {
    return this.http.get<ApiResponse<ApiBranch>>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  create(data: Omit<Branch, 'id'>): Observable<Branch> {
    const payload: BranchPayload = {
      name:        data.name,
      description: data.description ?? null,
      location:    data.location ?? '',
      isActive:    data.isActive,
    };
    return this.http.post<ApiResponse<ApiBranch>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: Branch): Observable<void> {
    const payload: BranchPayload = {
      name:        data.name,
      description: data.description ?? null,
      location:    data.location ?? '',
      isActive:    data.isActive,
    };
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toModel(item: ApiBranch): Branch {
    return {
      id:          item.id,
      code:        item.code,
      name:        item.name,
      description: item.description ?? undefined,
      location:    item.location ?? undefined,
      isActive:    item.isActive,
    };
  }
}
