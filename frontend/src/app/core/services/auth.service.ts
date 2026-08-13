import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
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
  readonly isInitialized = signal(false);

  constructor() {
    // Defer initialization to avoid circular dependency
    setTimeout(() => this.initializeAuth(), 0);
  }

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        this.setAuthToken(response.token);
        this.currentUser.set(response.user);
      })
    );
  }

  logout(): void {
    this.clearAuthToken();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  hasRole(allowedRoles: string[]): boolean {
    const role = this.userRole();
    return allowedRoles.includes(role);
  }

  private initializeAuth(): void {
    const token = this.getAuthToken();
    
    if (!token) {
      console.log('[AuthService] No token found, marking as initialized');
      this.isInitialized.set(true);
      return;
    }

    console.log('[AuthService] Token found, fetching current user...');
    
    // Attempt to restore session by fetching current user
    this.http.get<UserDto>(`${this.apiUrl}/me`).subscribe({
      next: (user) => {
        console.log('[AuthService] User loaded successfully:', user.email);
        this.currentUser.set(user);
        this.isInitialized.set(true);
      },
      error: (error) => {
        console.error('[AuthService] Error loading user:', error.status, error.message);
        // Only clear token if it's actually invalid (401/403)
        if (error.status === 401 || error.status === 403) {
          console.log('[AuthService] Token invalid, clearing...');
          this.clearAuthToken();
        }
        this.isInitialized.set(true);
      }
    });
  }

  private setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private clearAuthToken(): void {
    localStorage.removeItem('auth_token');
  }
}
