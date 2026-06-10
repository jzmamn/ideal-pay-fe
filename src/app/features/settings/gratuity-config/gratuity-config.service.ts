import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { GratuityConfigModel } from './gratuity-config.model';

interface ApiGratuityConfig {
  id: number; code: string; name: string; description: string | null;
  formula: string | null; formulaEnabled: boolean; isActive: boolean;
}

type ApiPayload = Omit<ApiGratuityConfig, 'id' | 'code'> & {
  createdBy: number; modifiedBy: number;
};

@Injectable({ providedIn: 'root' })
export class GratuityConfigService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/gratuity-config`;

  getAll(): Observable<GratuityConfigModel[]> {
    return this.http.get<ApiResponse<ApiGratuityConfig[]>>(this.baseUrl)
      .pipe(map(r => r.data.map(i => this.toModel(i))));
  }

  getActive(): Observable<GratuityConfigModel | null> {
    return this.http.get<ApiResponse<ApiGratuityConfig | null>>(`${this.baseUrl}/active`)
      .pipe(map(r => r.data ? this.toModel(r.data) : null));
  }

  calculate(id: number, basicSalary: number, yearsOfService: number):
      Observable<{ result: number; expression: string }> {
    return this.http.post<ApiResponse<{ result: number; expression: string }>>(
      `${this.baseUrl}/${id}/calculate`,
      { basicSalary, yearsOfService }
    ).pipe(map(r => r.data));
  }

  create(data: Omit<GratuityConfigModel, 'id' | 'code'>): Observable<GratuityConfigModel> {
    return this.http.post<ApiResponse<ApiGratuityConfig>>(this.baseUrl, this.toPayload(data))
      .pipe(map(r => this.toModel(r.data)));
  }

  update(id: number, data: Omit<GratuityConfigModel, 'id' | 'code'>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, this.toPayload(data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toModel(i: ApiGratuityConfig): GratuityConfigModel {
    return {
      id:             i.id,
      code:           i.code,
      name:           i.name,
      description:    i.description ?? undefined,
      formula:        i.formula ?? undefined,
      formulaEnabled: i.formulaEnabled ?? false,
      isActive:       i.isActive,
    };
  }

  private toPayload(data: Omit<GratuityConfigModel, 'id' | 'code'>): ApiPayload {
    return {
      name:           data.name,
      description:    data.description ?? null,
      formula:        data.formula ?? null,
      formulaEnabled: data.formulaEnabled ?? false,
      isActive:       data.isActive,
      createdBy:      1,
      modifiedBy:     1,
    };
  }
}
