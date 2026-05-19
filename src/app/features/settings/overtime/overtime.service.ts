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
  isActive: boolean;
  liableForEPF: boolean;
  liableForETF: boolean;
  liableForNopay: boolean;
}

type ApiOvertimePayload = Omit<ApiOvertime, 'id'>;

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

  create(data: Omit<OvertimeModel, 'id'>): Observable<OvertimeModel> {
    const payload: ApiOvertimePayload = {
      code:           data.code,
      name:           data.name,
      isActive:       data.isActive,
      liableForEPF:   data.liableForEPF,
      liableForETF:   data.liableForETF,
      liableForNopay: data.liableForNopay,
    };
    return this.http.post<ApiResponse<ApiOvertime>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: Omit<OvertimeModel, 'id'>): Observable<void> {
    const payload: ApiOvertimePayload = {
      code:           data.code,
      name:           data.name,
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

  private toModel(item: ApiOvertime): OvertimeModel {
    return new OvertimeModel(
      item.id,
      item.code,
      item.name,
      item.isActive,
      item.liableForEPF,
      item.liableForETF,
      item.liableForNopay,
    );
  }
}
