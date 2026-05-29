import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { NoPayDays } from '../../../shared/models/master-data.models';

interface NopayResponse {
  id: number;
  code: string;
  name: string;
  days: number;
  description: string;
  isActive: boolean;
  createdById: number;
  createdByCode: string;
  createdByUserName: string;
  createdDate: string;
  modifiedById: number;
  modifiedByCode: string;
  modifiedByUserName: string;
  modifiedDate: string;
}

interface NopayRequest {
  name: string;
  days: number | null;
  description: string;
  isActive: boolean;
  createdBy: number;
  modifiedBy: number;
}

@Injectable({ providedIn: 'root' })
export class NopayDaysService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/nopay-days`;

  getAll(): Observable<NoPayDays[]> {
    return this.http.get<ApiResponse<NopayResponse[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getAllActive(): Observable<NoPayDays[]> {
    return this.http.get<ApiResponse<NopayResponse[]>>(this.baseUrl, { params: { isActive: 'true' } }).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getById(id: number): Observable<NoPayDays> {
    return this.http.get<ApiResponse<NopayResponse>>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  create(data: Omit<NoPayDays, 'id'>): Observable<NoPayDays> {
    const payload: NopayRequest = {
      name:        data.name,
      days:        data.days,
      description: data.description ?? '',
      isActive:    data.isActive,
      createdBy:   1,
      modifiedBy:  1,
    };
    return this.http.post<ApiResponse<NopayResponse>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: NoPayDays): Observable<void> {
    const payload: NopayRequest = {
      name:        data.name,
      days:        data.days,
      description: data.description ?? '',
      isActive:    data.isActive,
      createdBy:   1,
      modifiedBy:  1,
    };
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toModel(item: NopayResponse): NoPayDays {
    return {
      id:          item.id,
      code:        item.code,
      name:        item.name,
      days:        item.days,
      description: item.description || undefined,
      isActive:    item.isActive,
    };
  }
}
