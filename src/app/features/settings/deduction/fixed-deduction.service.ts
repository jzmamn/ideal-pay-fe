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
  amount: number;
  isActive: boolean;
  liableForEPF: boolean;
  liableForETF: boolean;
  liableForNopay: boolean;
  createdBy: number;
  createdDate: string | null;
  modifiedBy: number;
  modifiedDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

type ApiFixedDeductionPayload = Pick<ApiFixedDeduction,
  'code' | 'name' | 'amount' | 'isActive' |
  'liableForEPF' | 'liableForETF' | 'liableForNopay'
>;

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
    const payload: ApiFixedDeductionPayload = {
      code:           data.code,
      name:           data.name,
      amount:         data.amount!,
      isActive:       data.isActive,
      liableForEPF:   data.liableForEPF,
      liableForETF:   data.liableForETF,
      liableForNopay: data.liableForNopay,
    };
    return this.http.post<ApiResponse<ApiFixedDeduction>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: Omit<DeductionModel, 'type'>): Observable<void> {
    const payload: ApiFixedDeductionPayload = {
      code:           data.code,
      name:           data.name,
      amount:         data.amount!,
      isActive:       data.isActive,
      liableForEPF:   data.liableForEPF,
      liableForETF:   data.liableForETF,
      liableForNopay: data.liableForNopay,
    };
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toModel(item: ApiFixedDeduction): DeductionModel {
    return new DeductionModel(
      item.id,
      item.code,
      item.name,
      item.isActive,
      DeductionType.FIXED,
      item.amount,
      item.liableForEPF,
      item.liableForETF,
      item.liableForNopay,
    );
  }
}
