import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';

export interface BackupFile {
  fileName: string;
  sizeBytes: number;
  createdAt: string;
}

export interface BackupJobStatus {
  jobId: string;
  type: 'BACKUP' | 'RESTORE';
  state: 'RUNNING' | 'COMPLETED' | 'FAILED';
  progress: number;
  currentStep: string | null;
  tablesDone: number;
  totalTables: number;
  filePath: string;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
}

export interface BackupConfig {
  defaultDirectory: string;
}

@Injectable({ providedIn: 'root' })
export class BackupRestoreService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/backup-restore`;

  getConfig() {
    return this.http.get<ApiResponse<BackupConfig>>(`${this.url}/config`);
  }

  listFiles(path?: string) {
    let params = new HttpParams();
    if (path?.trim()) params = params.set('path', path.trim());
    return this.http.get<ApiResponse<BackupFile[]>>(`${this.url}/files`, { params });
  }

  startBackup(path?: string) {
    return this.http.post<ApiResponse<BackupJobStatus>>(`${this.url}/backup`, {
      path: path?.trim() || null,
    });
  }

  startRestore(fileName: string, path?: string) {
    return this.http.post<ApiResponse<BackupJobStatus>>(`${this.url}/restore`, {
      fileName,
      path: path?.trim() || null,
    });
  }

  getJob(jobId: string) {
    return this.http.get<ApiResponse<BackupJobStatus>>(`${this.url}/jobs/${jobId}`);
  }
}
