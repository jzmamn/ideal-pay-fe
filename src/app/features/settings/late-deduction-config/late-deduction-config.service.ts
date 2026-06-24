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
  liableForEpf:       boolean;
  liableForEtf:       boolean;
  liableForPaye:      boolean;
  liableForNopay:     boolean;
}

type ApiPayload = Omit<ApiLateDeductionConfig, 'id' | 'code'> & {
  modifiedBy: number;
};

@Injectable({ providedIn: 'root' })
export class LateDeductionConfigService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/late-deduction-config`;

  /** Returns the singleton config, or null if never set up. */
  get(): Observable<LateDeductionConfigModel | null> {
    return this.http.get<ApiResponse<ApiLateDeductionConfig | null>>(this.baseUrl)
      .pipe(map(r => r.data ? this.toModel(r.data) : null));
  }

  /** Upsert — creates on first call, updates on subsequent calls. */
  save(data: Omit<LateDeductionConfigModel, 'id' | 'code'>): Observable<LateDeductionConfigModel> {
    return this.http.put<ApiResponse<ApiLateDeductionConfig>>(this.baseUrl, this.toPayload(data))
      .pipe(map(r => this.toModel(r.data)));
  }

  /** Test the formula with sample values (no id needed). */
  calculate(basicSalary: number, lateHours: number): Observable<{ result: number; expression: string }> {
    return this.http.post<ApiResponse<{ result: number; expression: string }>>(
      `${this.baseUrl}/calculate`,
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
      liableForEpf:       item.liableForEpf  ?? true,
      liableForEtf:       item.liableForEtf  ?? true,
      liableForPaye:      item.liableForPaye ?? true,
      liableForNopay:     item.liableForNopay ?? false,
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
      liableForEpf:       data.liableForEpf  ?? true,
      liableForEtf:       data.liableForEtf  ?? true,
      liableForPaye:      data.liableForPaye ?? true,
      liableForNopay:     data.liableForNopay ?? false,
      modifiedBy:         1, // TODO: replace with auth user id
    };
  }
}
