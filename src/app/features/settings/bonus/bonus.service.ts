import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { BonusModel } from './bonus.model';

// ── API shapes ────────────────────────────────────────────────────────────────

interface ApiBonusResponse {
  id: number;
  code: string;
  name: string;
  description: string | null;
  amount: number;
  isActive: boolean;
  isTaxable: boolean;
  liableForEpf: boolean;
  liableForEtf: boolean;
  liableForPaye: boolean;
  liableNoPay: boolean;
  formula: string | null;
  formulaEnabled: boolean;
  createdById: number;
  createdByCode: string;
  createdByUserName: string;
  createdDate: string;
  modifiedById: number;
  modifiedByCode: string;
  modifiedByUserName: string;
  modifiedDate: string;
}

type ApiBonusPayload = Pick<ApiBonusResponse,
  'name' | 'description' | 'amount' | 'isActive' | 'isTaxable' |
  'liableForEpf' | 'liableForEtf' | 'liableForPaye' | 'liableNoPay' |
  'formula' | 'formulaEnabled'
> & { createdBy: number; modifiedBy: number };

export interface BonusCalculateResult {
  expression: string;
  result: number;
  context: Record<string, unknown>;
  technicalError?: string;
  userFriendlyError?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class BonusService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/bonus`;

  getAll(): Observable<BonusModel[]> {
    return this.http.get<ApiResponse<ApiBonusResponse[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getById(id: number): Observable<BonusModel> {
    return this.http.get<ApiResponse<ApiBonusResponse>>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  create(data: Omit<BonusModel, 'id' | 'code'>): Observable<BonusModel> {
    const payload = this.toPayload(data);
    return this.http.post<ApiResponse<ApiBonusResponse>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: Omit<BonusModel, 'code'>): Observable<void> {
    const payload = this.toPayload(data);
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  calculate(id: number, context: Record<string, unknown>): Observable<BonusCalculateResult> {
    return this.http.post<ApiResponse<BonusCalculateResult>>(
      `${this.baseUrl}/${id}/calculate`,
      context,
    ).pipe(map(res => res.data));
  }

  // ── Mapping ───────────────────────────────────────────────────────────────

  private toModel(item: ApiBonusResponse): BonusModel {
    return new BonusModel(
      item.id,
      item.code,
      item.name,
      item.description,
      item.amount,
      item.isActive,
      item.isTaxable,
      item.liableForEpf,
      item.liableForEtf,
      item.liableForPaye,
      item.liableNoPay,
      item.formula ?? undefined,
      item.formulaEnabled,
    );
  }

  private toPayload(data: Partial<BonusModel>): ApiBonusPayload {
    return {
      name:           data.name!,
      description:    data.description ?? null,
      amount:         data.amount!,
      isActive:       data.isActive!,
      isTaxable:      data.isTaxable!,
      liableForEpf:   data.liableForEpf!,
      liableForEtf:   data.liableForEtf!,
      liableForPaye:  data.liableForPaye!,
      liableNoPay:    data.liableNoPay!,
      formula:        data.formula ?? null,
      formulaEnabled: data.formulaEnabled!,
      createdBy:      1, // TODO: replace with AuthService user id
      modifiedBy:     1, // TODO: replace with AuthService user id
    };
  }
}
