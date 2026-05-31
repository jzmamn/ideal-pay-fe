import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';

// ── Backend response types ────────────────────────────────────────────────

/**
 * A single row from the SP pivot result.
 * Fixed fields: id, employee_no, first_name, last_name, payroll_name, basic_salary
 * FA/FD/VA/VD dynamic fields: {code} → amount
 * OT dynamic fields:          {code}_hours, {code}_amount
 * NoPay dynamic fields:       {code}_days,  {code}_amount
 */
export type PivotRow = Record<string, number | string | null>;

/** Full load response keyed by component type section */
export interface BatchLoadResponse {
  fixedAllowances:    PivotRow[];
  fixedDeductions:    PivotRow[];
  variableAllowances: PivotRow[];
  variableDeductions: PivotRow[];
  overtimes:          PivotRow[];
  nopays:             PivotRow[];
}

// ── Save payload types ────────────────────────────────────────────────────

export interface BatchSaveEntry {
  /** Component code matching master table code column e.g. FA_001 */
  componentCode: string;
  /** FA | FD | VA | VD | OT | NOPAY */
  componentType: string;
  employeeId:    number;
  /** amount = 0 triggers a delete on the backend */
  amount:        number;
  /** OT only */
  hours?:        number;
  /** NOPAY only */
  days?:         number;
}

export interface BatchSavePayload {
  periodMonth: number;
  periodYear:  number;
  entries:     BatchSaveEntry[];
}

// ── Service ───────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class BatchService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/batch-allowance`;

  load(periodMonth: number, periodYear: number): Observable<BatchLoadResponse> {
    return this.http
      .get<ApiResponse<BatchLoadResponse>>(
        `${this.baseUrl}?month=${periodMonth}&year=${periodYear}`
      )
      .pipe(map(r => r.data));
  }

  /**
   * Upsert / delete batch entries.
   * amount > 0  → upsert
   * amount = 0  → delete existing record
   *
   * @param modifiedBy  current logged-in user id
   */
  save(payload: BatchSavePayload, modifiedBy: number): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}?modifiedBy=${modifiedBy}`,
      payload
    );
  }
}
