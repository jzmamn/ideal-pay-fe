import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { LateDeductionConfigModel } from './late-deduction-config.model';

interface ApiLateDeductionConfig {
  id:                 number;
  code:               string;
  name:               string;
  description:        string | null;
  workingDays:        number;
  workingHoursPerDay: number;
  isActive:           boolean;
  formula:            string | null;
  formulaEnabled:     boolean;
}

type ApiPayload = Omit<ApiLateDeductionConfig, 'id' | 'code'> & {
  createdBy:  number;
  modifiedBy: number;
};

@Injectable({ providedIn: 'root' })
export class LateDeductionConfigService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/late-deduction-config`;

  getAll(): Observable<LateDeductionConfigModel[]> {
    return this.http.get<ApiResponse<ApiLateDeductionConfig[]>>(this.baseUrl)
      .pipe(map(r => r.data.map(item => this.toModel(item))));
  }

  create(data: Omit<LateDeductionConfigModel, 'id' | 'code'>): Observable<LateDeductionConfigModel> {
    return this.http.post<ApiResponse<ApiLateDeductionConfig>>(this.baseUrl, this.toPayload(data))
      .pipe(map(r => this.toModel(r.data)));
  }

  update(id: number, data: Omit<LateDeductionConfigModel, 'id' | 'code'>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, this.toPayload(data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** Test the formula with sample values. */
  calculate(id: number, basicSalary: number, lateHours: number): Observable<{ result: number; expression: string }> {
    return this.http.post<ApiResponse<{ result: number; expression: string }>>(
      `${this.baseUrl}/${id}/calculate`,
      { basicSalary, lateHours }
    ).pipe(map(r => r.data));
  }

  private toModel(item: ApiLateDeductionConfig): LateDeductionConfigModel {
    return {
      id:                 item.id,
      code:               item.code,
      name:               item.name,
      description:        item.description ?? undefined,
      workingDays:        item.workingDays,
      workingHoursPerDay: item.workingHoursPerDay,
      isActive:           item.isActive,
      formula:            item.formula ?? undefined,
      formulaEnabled:     item.formulaEnabled ?? false,
    };
  }

  private toPayload(data: Omit<LateDeductionConfigModel, 'id' | 'code'>): ApiPayload {
    return {
      name:               data.name,
      description:        data.description ?? null,
      workingDays:        data.workingDays,
      workingHoursPerDay: data.workingHoursPerDay,
      isActive:           data.isActive,
      formula:            data.formula ?? null,
      formulaEnabled:     data.formulaEnabled ?? false,
      createdBy:          1, // TODO: replace with auth user id
      modifiedBy:         1,
    };
  }
}
