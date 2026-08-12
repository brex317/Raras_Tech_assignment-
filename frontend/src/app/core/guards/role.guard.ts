import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  const allowedRoles = route.data['allowedRoles'] as string[];
  const user = authService.currentUser();

  if (user && allowedRoles.includes(user.role)) {
    return true;
  }

  // Perm error, toast message and redirect
  snackBar.open('Access denied. You do not have permission to view this page.', 'Close', {
    duration: 4000,
    horizontalPosition: 'end',
    verticalPosition: 'top',
    panelClass: ['error-snackbar']
  });

  router.navigate(['/']);
  return false;
};
