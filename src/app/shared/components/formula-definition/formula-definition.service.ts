import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import {
  FormulaDefinitionRequestDTO,
  FormulaType,
  FormulaValidateResponseDTO,
} from './formula-definition.models';

@Injectable({ providedIn: 'root' })
export class FormulaDefinitionService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/formula`;

  create(data: FormulaDefinitionRequestDTO): Observable<unknown> {
    return this.http
      .post<ApiResponse<unknown>>(this.baseUrl, data)
      .pipe(map(res => res.data));
  }

  update(id: number, data: FormulaDefinitionRequestDTO): Observable<unknown> {
    return this.http
      .put<ApiResponse<unknown>>(`${this.baseUrl}/${id}`, data)
      .pipe(map(res => res.data));
  }

  getByType(formulaType: FormulaType): Observable<{ id: number; expression: string; isActive: boolean } | null> {
    return this.http
      .get<ApiResponse<{ id: number; expression: string; isActive: boolean } | null>>(`${this.baseUrl}/type/${formulaType}`)
      .pipe(map(res => res.data));
  }

  validate(expression: string): Observable<FormulaValidateResponseDTO> {
    return this.http
      .post<ApiResponse<FormulaValidateResponseDTO>>(`${this.baseUrl}/validate`, { expression })
      .pipe(map(res => res.data));
  }
}
