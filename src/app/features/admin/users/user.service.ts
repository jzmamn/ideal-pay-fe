import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject, catchError, map, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { API_BASE_URL } from '../../../api-url.token';
import { ApiResponse } from '../../../shared/models/api-response.model';
import { UserModel } from './user.model';

interface ApiUser {
  id:         number;
  code:       string;
  username?:  string;
  userName?:  string;
  user_name?: string;
  fullName?:  string;
  full_name?: string;
  name?:      string;
  email?:         string;
  emailAddress?:  string;
  email_address?: string;
  role?:          string;
  roleName?:  string;
  role_name?: string;
  isActive?:  boolean;
  is_active?: boolean;
  active?:    boolean;
}

interface ApiUserPayload {
  code:      string;
  username:  string;
  fullName:  string;
  email:     string;
  role:      string;
  isActive:  boolean;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http     = inject(HttpClient);
  private readonly baseUrl  = `${inject(API_BASE_URL)}/user`;
  private readonly refresh$ = new Subject<void>();

  readonly users = toSignal(
    this.refresh$.pipe(
      switchMap(() =>
        this.http.get<ApiResponse<ApiUser[]>>(this.baseUrl).pipe(
          map(res => res.data.map(item => this.toModel(item))),
          catchError(() => of([] as UserModel[])),
        ),
      ),
    ),
    { initialValue: [] as UserModel[] },
  );

  reload(): void {
    this.refresh$.next();
  }

  create(data: Omit<UserModel, 'id'> & { password: string }): Observable<UserModel> {
    const payload: ApiUserPayload = {
      code:     data.code,
      username: data.username,
      fullName: data.fullName,
      email:    data.email,
      role:     data.role,
      isActive: data.isActive,
      password: data.password,
    };
    return this.http.post<ApiResponse<ApiUser>>(this.baseUrl, payload).pipe(
      map(res => this.toModel(res.data)),
    );
  }

  update(id: number, data: Omit<UserModel, 'id'> & { password?: string }): Observable<void> {
    const payload: ApiUserPayload = {
      code:     data.code,
      username: data.username,
      fullName: data.fullName,
      email:    data.email,
      role:     data.role,
      isActive: data.isActive,
      ...(data.password ? { password: data.password } : {}),
    };
    return this.http.put<void>(`${this.baseUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  private toModel(item: ApiUser): UserModel {
    return {
      id:       item.id,
      code:     item.code ?? '',
      username: item.username ?? item.userName ?? item.user_name ?? '',
      fullName: item.fullName ?? item.full_name ?? item.name ?? '',
      email:    item.email ?? item.emailAddress ?? item.email_address ?? '',
      role:     item.role ?? item.roleName ?? item.role_name ?? '',
      isActive: item.isActive ?? item.is_active ?? item.active ?? false,
    };
  }
}
