import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';

export interface CodeItem {
  id  : number;
  code: string;
  name: string;
}

export interface ActiveCodesResponse {
  fixedAllowances  : CodeItem[];
  fixedDeductions  : CodeItem[];
  nopayDays        : CodeItem[];
  overtimes        : CodeItem[];
  variableAllowances: CodeItem[];
  variableDeductions: CodeItem[];
}

@Injectable({ providedIn: 'root' })
export class CodeDropdownService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/payroll/codes`;

  getActiveCodes(): Observable<ActiveCodesResponse> {
    return this.http
      .get<ApiResponse<ActiveCodesResponse>>(`${this.baseUrl}/active`)
      .pipe(map(r => r.data));
  }
}
