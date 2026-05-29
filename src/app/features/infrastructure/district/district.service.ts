import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { District } from '../../../shared/models/master-data.models';

interface ApiDistrict {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  createdById: number;
  createdByUserName: string;
  createdDate: string;
  modifiedById: number;
  modifiedByUserName: string;
  modifiedDate: string;
}

interface ApiDistrictPayload {
  name: string;
  isActive: boolean;
  createdBy: number;
  modifiedBy: number;
}

@Injectable({ providedIn: 'root' })
export class DistrictService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/district`;

  getAll(): Observable<District[]> {
    return this.http.get<ApiResponse<ApiDistrict[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getAllActive(): Observable<District[]> {
    return this.http.get<ApiResponse<ApiDistrict[]>>(this.baseUrl, { params: { isActive: 'true' } }).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getById(id: number): Observable<District> {
    return this.http.get<ApiResponse<ApiDistrict>>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  create(data: Omit<District, 'id'>): Observable<District> {
    const payload: ApiDistrictPayload = {
      name:       data.name,
      isActive:   data.isActive,
      createdBy:  1,
      modifiedBy: 1,
    };
    return this.http.post<ApiResponse<ApiDistrict>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: District): Observable<void> {
    const payload: ApiDistrictPayload = {
      name:       data.name,
      isActive:   data.isActive,
      createdBy:  1,
      modifiedBy: 1,
    };
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toModel(item: ApiDistrict): District {
    return {
      id:       item.id,
      code:     item.code,
      name:     item.name,
      isActive: item.isActive,
    };
  }
}
