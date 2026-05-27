import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { OvertimeModel } from './overtime.model';

interface ApiOvertime {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  formula: string | null;
  formulaEnabled: boolean;
  createdBy: number;
  modifiedBy: number;
  createdAt: string | null;
  updatedAt: string | null;
}

type ApiOvertimePayload = Pick<ApiOvertime,
  'name' | 'description' | 'isActive' | 'formula' | 'formulaEnabled' | 'createdBy' | 'modifiedBy'
>;

@Injectable({ providedIn: 'root' })
export class OvertimeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/overtime`;

  getAll(): Observable<OvertimeModel[]> {
    return this.http.get<ApiResponse<ApiOvertime[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getById(id: number): Observable<OvertimeModel> {
    return this.http.get<ApiResponse<ApiOvertime>>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  create(data: Omit<OvertimeModel, 'id' | 'code'>): Observable<OvertimeModel> {
    const payload: ApiOvertimePayload = {
      name:           data.name,
      description:    data.description ?? null,
      isActive:       data.isActive,
      formula:        data.formula ?? null,
      formulaEnabled: data.formulaEnabled ?? false,
      createdBy:      1,
      modifiedBy:     1,
    };
    return this.http.post<ApiResponse<ApiOvertime>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: Omit<OvertimeModel, 'id' | 'code'>): Observable<void> {
    const payload: ApiOvertimePayload = {
      name:           data.name,
      description:    data.description ?? null,
      isActive:       data.isActive,
      formula:        data.formula ?? null,
      formulaEnabled: data.formulaEnabled ?? false,
      createdBy:      1,
      modifiedBy:     1,
    };
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toModel(item: ApiOvertime): OvertimeModel {
    return new OvertimeModel(
      item.id,
      item.code,
      item.name,
      item.description ?? undefined,
      item.isActive,
      item.formula ?? undefined,
      item.formulaEnabled ?? false,
    );
  }
}
