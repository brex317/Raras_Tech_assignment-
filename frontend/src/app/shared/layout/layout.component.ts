import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatChipsModule
  ],
  template: `
    <div class="flex flex-col h-screen overflow-hidden">

      <!-- ── Top Toolbar ── -->
      <header class="toolbar-bar flex items-center justify-between px-5 shrink-0 z-20">

        <!-- Brand -->
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm border border-white/10 shrink-0">
            <img src="assets/logo.svg" alt="RARAS" class="w-full h-full object-contain p-1" />
          </div>
          <div class="leading-none">
            <span class="block text-sm font-bold text-white tracking-tight">
              Raras <span class="text-rose-400">Technologies</span>
            </span>
            <span class="block text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">Asset Management</span>
          </div>
        </div>

        <!-- Right side -->
        <div class="flex items-center gap-3" *ngIf="user()">

          <!-- Role pill -->
          <span class="role-pill">{{ user()?.role }}</span>

          <!-- User menu -->
          <button mat-button [matMenuTriggerFor]="userMenu" class="user-btn">
            <div class="avatar">{{ userInitials() }}</div>
            <span class="hidden sm:block text-sm font-medium text-slate-200">{{ user()?.fullName }}</span>
            <mat-icon class="!text-slate-500 !text-[18px] !w-[18px] !h-[18px]">expand_more</mat-icon>
          </button>

          <mat-menu #userMenu="matMenu" xPosition="before">
            <div class="menu-user-header">
              <p class="font-semibold text-sm text-slate-900">{{ user()?.fullName }}</p>
              <p class="text-xs text-slate-500 mt-0.5">{{ user()?.email }}</p>
            </div>
            <button mat-menu-item (click)="logout()" class="menu-logout-item">
              <mat-icon class="text-rose-500 !text-[18px]">logout</mat-icon>
              <span class="text-sm text-slate-700 font-medium">Sign out</span>
            </button>
          </mat-menu>
        </div>
      </header>

      <div class="flex flex-1 overflow-hidden">

        <!-- ── Sidebar ── -->
        <nav class="sidebar flex flex-col justify-between shrink-0">
          <div class="pt-3 px-3 space-y-0.5">

            <a routerLink="/dashboard"
               routerLinkActive="nav-active"
               class="nav-item">
              <mat-icon class="nav-icon">space_dashboard</mat-icon>
              <span class="nav-label">Dashboard</span>
            </a>

            <a routerLink="/assets"
               routerLinkActive="nav-active"
               class="nav-item">
              <mat-icon class="nav-icon">inventory_2</mat-icon>
              <span class="nav-label">Assets</span>
            </a>

            <a routerLink="/organization-units"
               routerLinkActive="nav-active"
               class="nav-item">
              <mat-icon class="nav-icon">account_tree</mat-icon>
              <span class="nav-label">Org Structure</span>
            </a>

          </div>

          <!-- Sidebar footer -->
          <div class="sidebar-footer">
            <span class="text-[10px] text-slate-500 uppercase tracking-widest">RARAS Technologies PLC</span>
          </div>
        </nav>

        <!-- ── Main content ── -->
        <main class="flex-1 overflow-y-auto bg-[#f5f7fa] p-6 md:p-8">
          <router-outlet></router-outlet>
        </main>

      </div>
    </div>
  `,
  styles: [`
    /* ── Toolbar ── */
    .toolbar-bar {
      height: 56px;
      background: #0f172a;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      box-shadow: 0 1px 3px rgb(0 0 0 / .25);
    }

    /* ── Role pill ── */
    .role-pill {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
      padding: 3px 10px;
      border-radius: 20px;
      background: rgba(99,102,241,0.18);
      color: #a5b4fc;
      border: 1px solid rgba(99,102,241,0.28);
      white-space: nowrap;
    }

    /* ── User button ── */
    .user-btn {
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      padding: 4px 10px !important;
      border-radius: 10px !important;
      transition: background 0.15s !important;
    }
    .user-btn:hover { background: rgba(255,255,255,0.06) !important; }

    /* ── Avatar ── */
    .avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }

    /* ── User menu ── */
    .menu-user-header {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      background: #f8fafc;
      pointer-events: none;
    }
    .menu-logout-item { padding: 10px 16px !important; }

    /* ── Sidebar ── */
    .sidebar {
      width: 220px;
      background: #0f172a;
      border-right: 1px solid rgba(255,255,255,0.06);
    }

    /* ── Nav items ── */
    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: 9px;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.15s ease, color 0.15s ease;
      color: #94a3b8;
    }
    .nav-item:hover {
      background: rgba(255,255,255,0.06);
      color: #e2e8f0;
    }
    .nav-item:hover .nav-icon { color: #e2e8f0 !important; }

    .nav-icon {
      font-size: 19px !important;
      width: 19px !important;
      height: 19px !important;
      line-height: 19px !important;
      color: #64748b;
      flex-shrink: 0;
      transition: color 0.15s;
    }

    .nav-label {
      font-size: 13.5px;
      font-weight: 500;
      letter-spacing: 0.01em;
    }

    /* ── Active nav ── */
    .nav-active {
      background: rgba(99,102,241,0.15) !important;
      color: #a5b4fc !important;
      border-left: 2px solid #6366f1;
      padding-left: 10px;
    }
    .nav-active .nav-icon { color: #a5b4fc !important; }

    /* ── Sidebar footer ── */
    .sidebar-footer {
      padding: 14px 16px;
      border-top: 1px solid rgba(255,255,255,0.06);
      text-align: center;
    }
  `]
})
export class LayoutComponent {
  private readonly authService = inject(AuthService);

  readonly user = this.authService.currentUser;

  readonly userInitials = computed(() => {
    const fullName = this.user()?.fullName;
    if (!fullName) return '';
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  });

  logout(): void {
    this.authService.logout();
  }
}
