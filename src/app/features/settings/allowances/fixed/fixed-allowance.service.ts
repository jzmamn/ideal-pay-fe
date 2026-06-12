import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../../api-url.token';
import { AllowanceModel } from '../allowance.model';
import { AllowanceType } from '../allowance.types';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

interface ApiFixedAllowance {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  isTaxable: boolean;
  liableForEpf: boolean;
  liableForEtf: boolean;
  liableForPaye: boolean;
  liableNoPay: boolean;
  formula: string | null;
  formulaEnabled: boolean;
  createdBy: number;
  createdDate: string | null;
  modifiedBy: number;
  modifiedDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

type ApiFixedAllowancePayload = Pick<ApiFixedAllowance,
  'name' | 'description' | 'isActive' | 'isTaxable' |
  'liableForEpf' | 'liableForEtf' | 'liableForPaye' | 'liableNoPay' |
  'formula' | 'formulaEnabled' | 'createdBy' | 'modifiedBy'
>;

@Injectable({ providedIn: 'root' })
export class FixedAllowanceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/fixed-allowance`;

  getAll(): Observable<AllowanceModel[]> {
    return this.http.get<ApiResponse<ApiFixedAllowance[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getById(id: number): Observable<AllowanceModel> {
    return this.http.get<ApiResponse<ApiFixedAllowance>>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  create(data: Omit<AllowanceModel, 'id' | 'type'>): Observable<AllowanceModel> {
    const payload: ApiFixedAllowancePayload = {
      name:           data.name,
      description:    data.description,

      isActive:       data.isActive,
      isTaxable:      data.isTaxable,
      liableForEpf:   data.liableForEpf,
      liableForEtf:   data.liableForEtf,
      liableForPaye:  data.liableForPaye,
      liableNoPay:    data.liableNoPay,
      formula:        data.formula ?? null,
      formulaEnabled: data.formulaEnabled,
      createdBy:      1,
      modifiedBy:     1,
    };
    return this.http.post<ApiResponse<ApiFixedAllowance>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: Omit<AllowanceModel, 'type'>): Observable<void> {
    const payload: ApiFixedAllowancePayload = {
      name:           data.name,
      description:    data.description,

      isActive:       data.isActive,
      isTaxable:      data.isTaxable,
      liableForEpf:   data.liableForEpf,
      liableForEtf:   data.liableForEtf,
      liableForPaye:  data.liableForPaye,
      liableNoPay:    data.liableNoPay,
      formula:        data.formula ?? null,
      formulaEnabled: data.formulaEnabled,
      createdBy:      1,
      modifiedBy:     1,
    };
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toModel(item: ApiFixedAllowance): AllowanceModel {
    return new AllowanceModel(
      item.id,
      item.code,
      item.name,
      item.description,
      item.isActive,
      item.isTaxable,
      item.liableForEpf,
      item.liableForEtf,
      item.liableForPaye,
      item.liableNoPay,
      AllowanceType.FIXED,
      item.formula ?? undefined,
      item.formulaEnabled,
    );
  }
}
