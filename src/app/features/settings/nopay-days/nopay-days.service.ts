import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { NoPayDays } from '../../../shared/models/master-data.models';

interface ApiNoPayDays {
  id: number;
  code: string;
  name: string;
  days: number;
  description: string | null;
  isActive: boolean;
  createdBy: number;
  createdDate: string | null;
  modifiedBy: number;
  modifiedDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

type ApiNoPayDaysPayload = Pick<ApiNoPayDays, 'code' | 'name' | 'days' | 'description' | 'isActive' | 'createdBy' | 'modifiedBy'>;

@Injectable({ providedIn: 'root' })
export class NoPayDaysService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/nopay-days`;

  getAll(): Observable<NoPayDays[]> {
    return this.http.get<ApiResponse<ApiNoPayDays[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getAllActive(): Observable<NoPayDays[]> {
    return this.http.get<ApiResponse<ApiNoPayDays[]>>(this.baseUrl, { params: { isActive: 'true' } }).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getById(id: number): Observable<NoPayDays> {
    return this.http.get<ApiResponse<ApiNoPayDays>>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  create(data: Omit<NoPayDays, 'id'>): Observable<NoPayDays> {
    const payload: ApiNoPayDaysPayload = {
      code:        data.code,
      name:        data.name,
      days:        data.days,
      description: data.description ?? null,
      isActive:    data.isActive,
      createdBy:   1,
      modifiedBy:  1,
    };
    return this.http.post<ApiResponse<ApiNoPayDays>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: NoPayDays): Observable<void> {
    const payload: ApiNoPayDaysPayload = {
      code:        data.code,
      name:        data.name,
      days:        data.days,
      description: data.description ?? null,
      isActive:    data.isActive,
      createdBy:   1,
      modifiedBy:  1,
    };
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toModel(item: ApiNoPayDays): NoPayDays {
    return {
      id:          item.id,
      code:        item.code,
      name:        item.name,
      days:        item.days,
      description: item.description ?? undefined,
      isActive:    item.isActive,
    };
  }
}
