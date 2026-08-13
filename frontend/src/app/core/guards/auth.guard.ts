import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, take } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('[AuthGuard] Checking authentication for:', state.url);

  // Wait for auth service to initialize before checking authentication
  return toObservable(authService.isInitialized).pipe(
    filter(initialized => {
      console.log('[AuthGuard] Initialization status:', initialized);
      return initialized === true;
    }),
    take(1),
    map(() => {
      const isAuthenticated = authService.isAuthenticated();
      const user = authService.currentUser();
      
      console.log('[AuthGuard] Is authenticated:', isAuthenticated, 'User:', user?.email);
      
      if (isAuthenticated) {
        return true;
      }

      // Redirect to login page with return URL
      console.log('[AuthGuard] Not authenticated, redirecting to login');
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    })
  );
};
