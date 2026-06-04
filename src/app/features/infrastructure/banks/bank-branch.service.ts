import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { BankBranch } from '../../../shared/models/master-data.models';

interface ApiBankBranch {
  id: number;
  bankCode: string;
  bankName: string;
  branchCode: string;
  branchName: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class BankBranchService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/bank-branch`;

  getAll(): Observable<BankBranch[]> {
    return this.http.get<ApiResponse<ApiBankBranch[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => this.mapItem(item))),
    );
  }

  getByBankCode(bankCode: string): Observable<BankBranch[]> {
    return this.http.get<ApiResponse<ApiBankBranch[]>>(`${this.baseUrl}/by-bank/${bankCode}`).pipe(
      map(res => res.data.map(item => this.mapItem(item))),
    );
  }

  private mapItem(item: ApiBankBranch): BankBranch {
    return {
      id: Number(item.id),
      code: item.branchCode,
      name: `${item.branchName} - ${item.branchCode}`,
      bankId: 0,
      isActive: item.isActive,
    };
  }
}
