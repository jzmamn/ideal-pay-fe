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

interface ApiVariableAllowance {
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
  createdBy: number;
  createdDate: string | null;
  modifiedBy: number;
  modifiedDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

type ApiVariableAllowancePayload = Pick<ApiVariableAllowance,
  'name' | 'description' | 'isActive' |
  'liableForEpf' | 'liableForEtf' | 'liableForPaye' | 'liableNoPay' |
  'createdBy' | 'modifiedBy'
>;

@Injectable({ providedIn: 'root' })
export class VariableAllowanceService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/variable-allowance`;

  getAll(): Observable<AllowanceModel[]> {
    return this.http.get<ApiResponse<ApiVariableAllowance[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getById(id: number): Observable<AllowanceModel> {
    return this.http.get<ApiResponse<ApiVariableAllowance>>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  create(data: Omit<AllowanceModel, 'id' | 'type'>): Observable<AllowanceModel> {
    const payload: ApiVariableAllowancePayload = {
      name:          data.name,
      description:   data.description,
      isActive:      data.isActive,
      liableForEpf:  data.liableForEpf,
      liableForEtf:  data.liableForEtf,
      liableForPaye: data.liableForPaye,
      liableNoPay:   data.liableNoPay,
      createdBy:     1,
      modifiedBy:    1,
    };
    return this.http.post<ApiResponse<ApiVariableAllowance>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: Omit<AllowanceModel, 'type'>): Observable<void> {
    const payload: ApiVariableAllowancePayload = {
      name:          data.name,
      description:   data.description,
      isActive:      data.isActive,
      liableForEpf:  data.liableForEpf,
      liableForEtf:  data.liableForEtf,
      liableForPaye: data.liableForPaye,
      liableNoPay:   data.liableNoPay,
      createdBy:     1,
      modifiedBy:    1,
    };
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toModel(item: ApiVariableAllowance): AllowanceModel {
    return new AllowanceModel(
      item.id,
      item.code,
      item.name,
      item.description,
      undefined,
      item.isActive,
      item.isTaxable,
      item.liableForEpf,
      item.liableForEtf,
      item.liableForPaye,
      item.liableNoPay,
      AllowanceType.VARIABLE,
    );
  }
}
