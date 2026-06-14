import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { DeductionModel } from './deduction.model';
import { DeductionType } from './deduction.types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

interface ApiFixedDeduction {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  liableForEpf: boolean;
  liableForEtf: boolean;
  liableForPaye: boolean;
  liableNoPay: boolean;
  formula: string | null;
  createdBy: number;
  createdDate: string | null;
  modifiedBy: number;
  modifiedDate: string | null;
}

interface ApiFixedDeductionPayload {
  name: string;
  description: string | null;
  isActive: boolean;
  liableForEpf: boolean;
  liableForEtf: boolean;
  liableForPaye: boolean;
  liableNoPay: boolean;
  formula: string | null;
  createdBy: number;
  modifiedBy: number;
}

@Injectable({ providedIn: 'root' })
export class FixedDeductionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/fixed-deduction`;

  getAll(): Observable<DeductionModel[]> {
    return this.http.get<ApiResponse<ApiFixedDeduction[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getById(id: number): Observable<DeductionModel> {
    return this.http.get<ApiResponse<ApiFixedDeduction>>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  create(data: Omit<DeductionModel, 'id' | 'type'>): Observable<DeductionModel> {
    const payload: ApiFixedDeductionPayload = this.toPayload(data);
    return this.http.post<ApiResponse<ApiFixedDeduction>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: Omit<DeductionModel, 'type'>): Observable<void> {
    const payload: ApiFixedDeductionPayload = this.toPayload(data);
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toPayload(data: Omit<DeductionModel, 'id' | 'type'> | Omit<DeductionModel, 'type'>): ApiFixedDeductionPayload {
    return {
      name:                   data.name,
      description:            data.description,
      isActive:               data.isActive,
      liableForEpf:           data.liableForEpf,
      liableForEtf:           data.liableForEtf,
      liableForPaye:          data.liableForPaye,
      liableNoPay:            data.liableNoPay,
      formula:                data.formula ?? null,
      createdBy:              1,
      modifiedBy:             1,
    };
  }

  private toModel(item: ApiFixedDeduction): DeductionModel {
    return new DeductionModel(
      item.id,
      item.code,
      item.name,
      item.description,
      item.isActive,
      DeductionType.FIXED,
      item.liableForEpf,
      item.liableForEtf,
      item.liableForPaye,
      item.liableNoPay,
      item.formula ?? undefined,
    );
  }
}
