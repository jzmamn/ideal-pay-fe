import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../models/api-response.model';

interface FormulaFieldRaw {
  variable:    string;
  label:       string;
  dataType:    string;
  category:    string;
  description: string;
}

export interface FormulaFieldItem {
  label: string;
  value: string;
  hint:  string;
}

export interface FormulaFieldGroup {
  group: string;
  items: FormulaFieldItem[];
}

@Injectable({ providedIn: 'root' })
export class FormulaDefinitionFieldsService {
  private readonly http    = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/formula`;

  getFields(): Observable<FormulaFieldGroup[]> {
    return this.http
      .get<ApiResponse<FormulaFieldRaw[]>>(`${this.baseUrl}/fields`)
      .pipe(map(res => this.toGroups(res.data)));
  }

  private toGroups(fields: FormulaFieldRaw[]): FormulaFieldGroup[] {
    const buckets = new Map<string, FormulaFieldItem[]>();
    for (const f of fields) {
      if (!buckets.has(f.category)) buckets.set(f.category, []);
      buckets.get(f.category)!.push({ label: `${f.variable} - ${f.label}`, value: f.variable, hint: '' });
    }
    return Array.from(buckets.entries()).map(([group, items]) => ({ group, items }));
  }
}
