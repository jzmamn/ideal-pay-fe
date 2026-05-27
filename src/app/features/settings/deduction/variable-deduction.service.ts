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

interface ApiVariableDeduction {
  id: number;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
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

type ApiVariableDeductionPayload = Pick<ApiVariableDeduction,
  'name' | 'description' | 'isActive' |
  'liableForEpf' | 'liableForEtf' | 'liableForPaye' | 'liableNoPay' |
  'createdBy' | 'modifiedBy'
>;

@Injectable({ providedIn: 'root' })
export class VariableDeductionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/variable-deduction`;

  getAll(): Observable<DeductionModel[]> {
    return this.http.get<ApiResponse<ApiVariableDeduction[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getById(id: number): Observable<DeductionModel> {
    return this.http.get<ApiResponse<ApiVariableDeduction>>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  create(data: Omit<DeductionModel, 'id' | 'type'>): Observable<DeductionModel> {
    const payload: ApiVariableDeductionPayload = {
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
    return this.http.post<ApiResponse<ApiVariableDeduction>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: Omit<DeductionModel, 'type'>): Observable<void> {
    const payload: ApiVariableDeductionPayload = {
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

  private toModel(item: ApiVariableDeduction): DeductionModel {
    return new DeductionModel(
      item.id,
      item.code,
      item.name,
      item.description,
      item.isActive,
      DeductionType.VARIABLE,
      undefined,
      item.liableForEpf,
      item.liableForEtf,
      item.liableForPaye,
      item.liableNoPay,
    );
  }
}
