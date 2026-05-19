import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly isLoggedIn$ = new BehaviorSubject<boolean>(false);

  login(username: string, password: string): Observable<boolean> {
    const success = username === 'admin' && password === 'admin1';
    if (success) {
      this.isLoggedIn$.next(true);
    }
    return of(success);
  }

  logout(): void {
    this.isLoggedIn$.next(false);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn$.value;
  }
}
