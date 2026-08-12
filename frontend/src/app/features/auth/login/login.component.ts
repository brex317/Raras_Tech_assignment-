import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8 animate-fade-in">
        
        <div class="text-center">
          <div class="inline-flex items-center justify-center p-3 bg-white rounded-2xl border border-slate-700/40 mb-4 shadow-2xl">
            <img src="assets/logo.svg" alt="RARAS Technologies" class="h-14 w-auto object-contain" />
          </div>
          <h2 class="text-3xl font-extrabold text-white tracking-tight font-sans">Raras <span class="text-rose-500">TECHNOLOGIES</span></h2>
          <p class="mt-2 text-sm text-slate-300 font-medium">Organization Asset Management System</p>
        </div>

        <mat-card class="!p-8 !rounded-2xl !bg-white/95 !backdrop-blur-md !border-white/20 !shadow-2xl">
          <mat-progress-bar *ngIf="loading()" mode="query" class="absolute top-0 left-0 right-0 rounded-t-2xl"></mat-progress-bar>
          
          <h3 class="text-xl font-bold text-slate-800 mb-6 font-sans">Sign in to your account</h3>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
            
            <!-- Email -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Email address</mat-label>
              <input matInput type="email" formControlName="email" placeholder="name@raras.com" required>
              <mat-icon matSuffix class="text-slate-400">email</mat-icon>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                Invalid email format
              </mat-error>
            </mat-form-field>

            <!-- Password -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Password</mat-label>
              <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="password" required>
              <button type="button" mat-icon-button matSuffix (click)="hidePassword.set(!hidePassword())" [attr.aria-label]="'Hide password'" [attr.aria-pressed]="hidePassword()">
                <mat-icon class="text-slate-400">{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" [disabled]="loginForm.invalid || loading()" class="w-full !py-6 !font-semibold shadow-lg">
              Sign In
            </button>
          </form>

          <!-- Hint Section -->
          <div class="mt-6 pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1">
            <span class="font-semibold block text-slate-700">Demo User Credentials:</span>
            <div class="grid grid-cols-2 gap-2 mt-1">
              <div>Admin: <code class="bg-slate-100 p-0.5 rounded text-indigo-600">admin&#64;raras.com</code></div>
              <div>Pass: <code class="bg-slate-100 p-0.5 rounded text-indigo-600">Admin&#64;123</code></div>
              <div>Manager: <code class="bg-slate-100 p-0.5 rounded text-indigo-600">manager&#64;raras.com</code></div>
              <div>Pass: <code class="bg-slate-100 p-0.5 rounded text-indigo-600">Manager&#64;123</code></div>
            </div>
          </div>

        </mat-card>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  readonly loading = signal(false);
  readonly hidePassword = signal(true);

  onSubmit(): void {
    if (this.loginForm.invalid) {
      return;
    }

    this.loading.set(true);
    const credentials = this.loginForm.value as { email: string; password: string };

    this.authService.login(credentials).subscribe({
      next: () => {
        this.loading.set(false);
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        this.router.navigateByUrl(returnUrl);
        this.snackBar.open('Logged in successfully.', 'Close', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        });
      },
      error: (err) => {
        this.loading.set(false);
        const message = err.error?.message || 'Login failed. Please check your credentials.';
        this.snackBar.open(message, 'Close', {
          duration: 5000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }
}
