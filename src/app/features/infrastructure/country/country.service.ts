import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { Country } from '../../../shared/models/master-data.models';

interface ApiCountry {
  id: number;
  name: string;
  iso2: string;
  iso3: string;
  phoneCode: number;
  postcodeRequired: boolean;
  isEu: boolean;
}

interface ApiCountryPayload {
  name: string;
  iso2: string;
  isActive: boolean;
}

@Injectable({ providedIn: 'root' })
export class CountryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/country`;

  getAll(): Observable<Country[]> {
    return this.http.get<ApiResponse<ApiCountry[]>>(this.baseUrl).pipe(
      map(res => res.data.map(item => this.toModel(item))),
    );
  }

  create(data: Omit<Country, 'id'>): Observable<Country> {
    const payload: ApiCountryPayload = { iso2: data.code, name: data.name, isActive: data.isActive };
    return this.http.post<ApiResponse<ApiCountry>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: Country): Observable<void> {
    const payload: ApiCountryPayload = { iso2: data.code, name: data.name, isActive: data.isActive };
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toModel(item: ApiCountry): Country {
    return { id: item.id, code: item.iso2, name: item.name, isActive: true };
  }
}
