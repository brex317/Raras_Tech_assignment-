import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of } from 'rxjs';
import { LoginResponse, UserDto } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  // Signals for state management
  readonly currentUser = signal<UserDto | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly userRole = computed(() => this.currentUser()?.role || '');

  constructor() {
    this.checkAuthentication();
  }

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        localStorage.setItem('auth_token', response.token);
        this.currentUser.set(response.user);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  hasRole(allowedRoles: string[]): boolean {
    const role = this.userRole();
    return allowedRoles.includes(role);
  }

  private checkAuthentication(): void {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return;
    }

    // Attempt to load current user profile from token context
    this.http.get<UserDto>(`${this.apiUrl}/me`).subscribe({
      next: (user) => {
        this.currentUser.set(user);
      },
      error: () => {
        this.logout();
      }
    });
  }
}
