import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { Company } from '../../../shared/models/master-data.models';

interface ApiCompany {
  id: number;
  code: string;
  name: string;
  contactPerson: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  addressEmail: string | null;
  telephone: string;
  fax: string | null;
  email: string | null;
  logo: string | null;
  isActive: boolean;
  createdBy: number;
  createdDate: string | null;
  modifiedBy: number;
  modifiedDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

type ApiCompanyPayload = Pick<ApiCompany,
  'code' | 'name' | 'contactPerson' | 'addressLine1' | 'addressLine2' | 'city' |
  'addressEmail' | 'telephone' | 'fax' | 'email' | 'logo' | 'isActive'>;

@Injectable({ providedIn: 'root' })
export class CompanyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/company`;

  getAll(): Observable<Company[]> {
    return this.http.get<ApiResponse<ApiCompany[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  getById(id: number): Observable<Company> {
    return this.http.get<ApiResponse<ApiCompany>>(`${this.baseUrl}/${id}`).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  create(data: Omit<Company, 'id'>): Observable<Company> {
    return this.http.post<ApiResponse<ApiCompany>>(this.baseUrl, this.toPayload(data)).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: Company): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, this.toPayload(data));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toPayload(data: Omit<Company, 'id'>): ApiCompanyPayload {
    return {
      code:          data.code,
      name:          data.name,
      contactPerson: data.contactPerson,
      addressLine1:  data.address.line1,
      addressLine2:  data.address.line2 ?? null,
      city:          data.address.city,
      addressEmail:  data.address.email ?? null,
      telephone:     data.telephone,
      fax:           data.fax ?? null,
      email:         data.email ?? null,
      logo:          data.logo ?? null,
      isActive:      data.isActive,
    };
  }

  private toModel(item: ApiCompany): Company {
    return {
      id:            item.id,
      code:          item.code,
      name:          item.name,
      isActive:      item.isActive,
      contactPerson: item.contactPerson,
      address: {
        line1: item.addressLine1,
        line2: item.addressLine2 ?? undefined,
        city:  item.city,
        email: item.addressEmail ?? undefined,
      },
      telephone: item.telephone,
      fax:       item.fax ?? undefined,
      email:     item.email ?? undefined,
      logo:      item.logo ?? undefined,
    };
  }
}
