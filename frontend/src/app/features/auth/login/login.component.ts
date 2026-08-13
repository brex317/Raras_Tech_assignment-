import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-4">
      <div class="w-full max-w-sm animate-fade-in">

        <!-- Card -->
        <div class="relative bg-white rounded-2xl shadow-2xl overflow-hidden">

          <!-- Loading bar -->
          <mat-progress-bar *ngIf="loading()" mode="query" class="absolute top-0 left-0 right-0"></mat-progress-bar>

          <div class="px-7 pt-8 pb-7">

            <!-- Logo inside card -->
            <div class="flex justify-center mb-6">
              <div class="inline-flex items-center justify-center w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                <img src="assets/logo.svg" alt="RARAS Technologies" class="h-9 w-auto object-contain" />
              </div>
            </div>

            <h2 class="text-base font-semibold text-slate-800 mb-5 text-center">Sign in to your account</h2>

            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-3">

              <!-- Email -->
              <div class="field-group">
                <label class="field-label">Email address</label>
                <div class="input-wrap" [class.focused]="emailFocused" [class.has-error]="loginForm.get('email')?.invalid && loginForm.get('email')?.touched">
                  <input
                    type="email"
                    formControlName="email"
                    placeholder="name@raras.com"
                    class="plain-input"
                    (focus)="emailFocused = true"
                    (blur)="emailFocused = false"
                    required>
                </div>
                <span class="field-error" *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.hasError('required')">Email is required</span>
                <span class="field-error" *ngIf="loginForm.get('email')?.touched && loginForm.get('email')?.hasError('email')">Invalid email format</span>
              </div>

              <!-- Password -->
              <div class="field-group">
                <label class="field-label">Password</label>
                <div class="input-wrap" [class.focused]="passwordFocused" [class.has-error]="loginForm.get('password')?.invalid && loginForm.get('password')?.touched">
                  <input
                    [type]="hidePassword() ? 'password' : 'text'"
                    formControlName="password"
                    placeholder="••••••••"
                    class="plain-input"
                    (focus)="passwordFocused = true"
                    (blur)="passwordFocused = false"
                    required>
                  <button type="button" class="toggle-vis" (click)="hidePassword.set(!hidePassword())" [attr.aria-label]="'Toggle password visibility'">
                    <mat-icon class="vis-icon">{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                  </button>
                </div>
                <span class="field-error" *ngIf="loginForm.get('password')?.touched && loginForm.get('password')?.hasError('required')">Password is required</span>
              </div>

              <!-- Submit -->
              <button
                type="submit"
                [disabled]="loginForm.invalid || loading()"
                class="submit-btn">
                <span *ngIf="!loading()">Sign In</span>
                <span *ngIf="loading()" class="flex items-center justify-center gap-2">
                  <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Signing in...
                </span>
              </button>
            </form>

            <!-- Demo credentials -->
            <div class="mt-5 pt-4 border-t border-slate-100">
              <p class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Demo Credentials</p>
              <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-500">
                <div>Admin: <code class="bg-slate-50 border border-slate-200 px-1 py-0.5 rounded text-indigo-600 font-mono">admin&#64;raras.com</code></div>
                <div>Pass: <code class="bg-slate-50 border border-slate-200 px-1 py-0.5 rounded text-indigo-600 font-mono">Admin&#64;123</code></div>
                <div>Manager: <code class="bg-slate-50 border border-slate-200 px-1 py-0.5 rounded text-indigo-600 font-mono">manager&#64;raras.com</code></div>
                <div>Pass: <code class="bg-slate-50 border border-slate-200 px-1 py-0.5 rounded text-indigo-600 font-mono">Manager&#64;123</code></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .field-group {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }

    .field-label {
      font-size: 12.5px;
      font-weight: 500;
      color: #475569;
      letter-spacing: 0.01em;
    }

    .input-wrap {
      display: flex;
      align-items: center;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      background: #fff;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
      overflow: hidden;
    }

    .input-wrap.focused {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .input-wrap:hover:not(.focused) {
      border-color: #94a3b8;
    }

    .input-wrap.has-error {
      border-color: #f43f5e;
    }

    .input-wrap.has-error.focused {
      box-shadow: 0 0 0 3px rgba(244, 63, 94, 0.1);
    }

    .plain-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      padding: 10px 12px;
      font-size: 13.5px;
      color: #1e293b;
      width: 100%;
    }

    .plain-input::placeholder {
      color: #94a3b8;
    }

    .toggle-vis {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 10px;
      background: transparent;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      transition: color 0.15s ease;
      flex-shrink: 0;
    }

    .toggle-vis:hover {
      color: #64748b;
    }

    .vis-icon {
      font-size: 17px !important;
      width: 17px !important;
      height: 17px !important;
      line-height: 17px !important;
    }

    .field-error {
      font-size: 11px;
      color: #f43f5e;
      margin-top: 2px;
    }

    .submit-btn {
      width: 100%;
      height: 40px;
      margin-top: 4px;
      font-size: 13.5px;
      font-weight: 600;
      letter-spacing: 0.02em;
      border-radius: 8px;
      border: none;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff;
      cursor: pointer;
      transition: opacity 0.15s ease, box-shadow 0.15s ease;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
    }

    .submit-btn:hover:not([disabled]) {
      opacity: 0.92;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.45);
    }

    .submit-btn:active:not([disabled]) {
      opacity: 0.85;
    }

    .submit-btn[disabled] {
      background: #e2e8f0;
      color: #94a3b8;
      box-shadow: none;
      cursor: not-allowed;
    }
  `]
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
  emailFocused = false;
  passwordFocused = false;

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
