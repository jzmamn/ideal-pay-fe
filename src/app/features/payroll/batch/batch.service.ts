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
 * SalAdv fixed fields:        sal_adv_amount, sal_adv_label, is_processed, processed_date
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
  lates:              PivotRow[];
  salaryAdvances:     PivotRow[];
  bonuses:            PivotRow[];
  loans:              PivotRow[];
  salaryIncrements:   PivotRow[];
}

// ── Save payload types ────────────────────────────────────────────────────

export interface BatchSaveEntry {
  /** Component code matching master table code column e.g. FA_001 */
  componentCode: string;
  /** FA | FD | VA | VD | OT | NOPAY | LATE | SAL_ADV | BONUS | LOAN | SAL_INCR */
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

// ── Load summary ──────────────────────────────────────────────────────────

export interface LoadSummaryResponse {
  employeesProcessed: number;
  recordsUpserted:    number;
  errors:             string[];
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
   * Triggers the server-side component load for all active employees.
   * Evaluates formulas / uses configured amounts and writes emp_fa, emp_fd,
   * emp_ot (rate), emp_np (rate), emp_late (rate), emp_bonus records.
   * Call `load()` afterwards to refresh the pivot data.
   */
  loadComponents(
    periodMonth: number,
    periodYear: number,
    userId: number,
  ): Observable<LoadSummaryResponse> {
    return this.http
      .post<ApiResponse<LoadSummaryResponse>>(
        `${this.baseUrl}/load?month=${periodMonth}&year=${periodYear}&userId=${userId}`,
        {},
      )
      .pipe(map(r => r.data));
  }

  /**
   * Triggers the server-side component load for a SINGLE employee.
   * Stores emp_fa, emp_fd, emp_ot.rate, emp_np.rate, emp_late.rate, emp_bonus records.
   * Call `loadProfile()` on the individual screen afterwards to refresh displayed data.
   */
  loadComponentsForEmployee(
    empId: number,
    periodMonth: number,
    periodYear: number,
    userId: number,
  ): Observable<LoadSummaryResponse> {
    return this.http
      .post<ApiResponse<LoadSummaryResponse>>(
        `${this.baseUrl}/load/employee?empId=${empId}&month=${periodMonth}&year=${periodYear}&userId=${userId}`,
        {},
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
