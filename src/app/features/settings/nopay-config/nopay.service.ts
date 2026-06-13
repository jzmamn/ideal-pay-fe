import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { NopayModel } from './nopay.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

interface ApiNopay {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  liableForEpf: boolean;
  liableForEtf: boolean;
  liableForPaye: boolean;
  formula: string | null;
  formulaEnabled: boolean;
  createdById: number;
  createdByCode: string;
  createdByUserName: string;
  createdDate: string | null;
  modifiedById: number;
  modifiedByCode: string;
  modifiedByUserName: string;
  modifiedDate: string | null;
}

type ApiNopayPayload = {
  name: string;
  description: string | null;
  isActive: boolean;
  liableForEpf: boolean;
  liableForEtf: boolean;
  liableForPaye: boolean;
  formula: string | null;
  formulaEnabled: boolean;
  createdBy: number;
  modifiedBy: number;
};

@Injectable({ providedIn: 'root' })
export class NopayService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/nopay`;

  getAll(isActive = 'all'): Observable<NopayModel[]> {
    return this.http
      .get<ApiResponse<ApiNopay[]>>(this.baseUrl, { params: { isActive } })
      .pipe(map(res => res.data.filter(item => item.id !== -1).map(item => this.toModel(item))));
  }

  getById(id: number): Observable<NopayModel> {
    return this.http
      .get<ApiResponse<ApiNopay>>(`${this.baseUrl}/${id}`)
      .pipe(map(res => this.toModel(res.data)));
  }

  create(data: Omit<NopayModel, 'id'>): Observable<NopayModel> {
    const payload = this.toPayload(data, true);
    return this.http
      .post<ApiResponse<ApiNopay>>(this.baseUrl, payload)
      .pipe(map(res => this.toModel(res.data)));
  }

  update(id: number, data: NopayModel): Observable<void> {
    const payload = this.toPayload(data, false);
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toPayload(data: Omit<NopayModel, 'id'>, isCreate: boolean): ApiNopayPayload {
    return {
      name:           data.name,
      description:    data.description,
      isActive:       data.isActive,
      liableForEpf:   data.liableForEpf,
      liableForEtf:   data.liableForEtf,
      liableForPaye:  data.liableForPaye,
      formula:        data.formulaEnabled ? (data.formula ?? null) : null,
      formulaEnabled: data.formulaEnabled,
      createdBy:      1,
      modifiedBy:     1,
    };
  }

  private toModel(item: ApiNopay): NopayModel {
    return new NopayModel(
      item.id,
      item.code,
      item.name,
      item.description,
      item.isActive,
      item.liableForEpf,
      item.liableForEtf,
      item.liableForPaye,
      item.formula ?? undefined,
      item.formulaEnabled,
    );
  }
}
