import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';

export interface LicenseStatus {
  status: string;
  message: string;
  licenseId: string;
  plan: string;
  employeeLimit: number;
  employeeCount: number;
  validFrom: string;
  validTill: string;
  maintenanceAvailable: boolean;
}

@Injectable({ providedIn: 'root' })
export class LicenseService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL).replace(/\/payroll$/, '')}/api/license`;
  current() { return this.http.get<ApiResponse<LicenseStatus>>(`${this.url}/current`); }
  validate() { return this.http.post<ApiResponse<LicenseStatus>>(`${this.url}/validate`, {}); }
  importLicense(licenseContent: string, installedBy = 1) {
    return this.http.post<ApiResponse<LicenseStatus>>(`${this.url}/import`, { licenseContent, installedBy });
  }
}

