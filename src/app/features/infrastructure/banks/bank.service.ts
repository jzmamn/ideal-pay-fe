import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { Bank } from '../../../shared/models/master-data.models';

interface ApiBank {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class BankService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/bank`;

  getAll(): Observable<Bank[]> {
    return this.http.get<ApiResponse<ApiBank[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => ({
        id: item.id,
        code: item.code,
        name: item.name,
        isActive: item.isActive,
      }))),
    );
  }
}
