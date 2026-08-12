import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const snackBar = inject(MatSnackBar);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred.';

      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        errorMessage = `Network error: ${error.error.message}`;
      } else {
        // Backend returned an unsuccessful response code
        switch (error.status) {
          case 0:
            errorMessage = 'Cannot connect to the server. Please check your connection.';
            break;
          case 401:
            errorMessage = 'Session expired. Please log in again.';
            authService.logout();
            break;
          case 403:
            errorMessage = 'Access denied. You do not have permission for this action.';
            break;
          case 404:
            errorMessage = error.error?.message || 'Requested resource not found.';
            break;
          case 400:
            errorMessage = error.error?.message || 'Invalid request parameters.';
            break;
          case 500:
            errorMessage = 'Internal server error. Please try again later.';
            break;
          default:
            errorMessage = error.error?.message || `Error Code ${error.status}: ${error.statusText}`;
            break;
        }
      }

      // Display the snackbar notification for the user
      snackBar.open(errorMessage, 'Dismiss', {
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });

      return throwError(() => error);
    })
  );
};
