import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { Grade } from '../../../shared/models/master-data.models';

interface ApiGrade {
  id: number;
  code: string;
  name: string;
  amount: number | null;
  description: string | null;
  isActive: boolean;
  createdBy: number;
  createdDate: string | null;
  modifiedBy: number;
  modifiedDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

type ApiGradePayload = Pick<ApiGrade, 'code' | 'name' | 'amount' | 'description' | 'isActive'>;

@Injectable({ providedIn: 'root' })
export class GradeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/grade`;

  getAll(): Observable<Grade[]> {
    return this.http.get<ApiResponse<ApiGrade[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getAllActive(): Observable<Grade[]> {
    return this.http.get<ApiResponse<ApiGrade[]>>(this.baseUrl, { params: { isActive: 'true' } }).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getById(id: number): Observable<Grade> {
    return this.http.get<ApiResponse<ApiGrade>>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  create(data: Omit<Grade, 'id'>): Observable<Grade> {
    const payload: ApiGradePayload = {
      code:        data.code,
      name:        data.name,
      amount:      data.amount ?? null,
      description: data.description ?? null,
      isActive:    data.isActive,
    };
    return this.http.post<ApiResponse<ApiGrade>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: Grade): Observable<void> {
    const payload: ApiGradePayload = {
      code:        data.code,
      name:        data.name,
      amount:      data.amount ?? null,
      description: data.description ?? null,
      isActive:    data.isActive,
    };
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toModel(item: ApiGrade): Grade {
    return {
      id:          item.id,
      code:        item.code,
      name:        item.name,
      amount:      item.amount ?? undefined,
      description: item.description ?? undefined,
      isActive:    item.isActive,
    };
  }
}
