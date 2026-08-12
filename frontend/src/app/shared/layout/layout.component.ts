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
      <!-- Top Toolbar -->
      <mat-toolbar class="!bg-slate-900 !text-white flex justify-between items-center shadow-lg z-20 !px-6 border-b border-slate-800">
        <div class="flex items-center space-x-3.5">
          <div class="w-10 h-10 rounded-xl bg-white p-1.5 flex items-center justify-center shadow-md border border-slate-700/50">
            <img src="assets/logo.svg" alt="RARAS Technologies" class="w-full h-full object-contain" />
          </div>
          <div>
            <span class="font-extrabold text-xl tracking-tight font-sans text-white">Raras <span class="text-rose-500 font-bold">TECHNOLOGIES</span></span>
            <span class="block text-[10px] text-slate-400 font-semibold tracking-widest uppercase -mt-0.5">Organization Asset Management System</span>
          </div>
        </div>

        <div class="flex items-center space-x-4" *ngIf="user()">
          <!-- Role Badge -->
          <mat-chip-listbox>
            <mat-chip-option 
              [color]="user()?.role === 'Administrator' ? 'primary' : 'accent'" 
              selectable="false" 
              selected
              class="!text-xs !font-bold !bg-cyan-950 !text-cyan-300 !border !border-cyan-500/30">
              {{ user()?.role }}
            </mat-chip-option>
          </mat-chip-listbox>

          <!-- User Menu Trigger -->
          <button mat-button [matMenuTriggerFor]="userMenu" class="flex items-center space-x-2 !text-white hover:!bg-slate-800/60 !rounded-xl !py-1 !px-3 transition-colors">
            <div class="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white text-xs shadow">
              {{ userInitials() }}
            </div>
            <span class="hidden md:inline font-semibold text-sm tracking-wide">{{ user()?.fullName }}</span>
            <mat-icon class="!text-slate-400">arrow_drop_down</mat-icon>
          </button>
          
          <mat-menu #userMenu="matMenu" xPosition="before" class="mt-2">
            <div class="px-4 py-3 border-b border-slate-100 bg-slate-50">
              <p class="font-bold text-sm text-slate-900">{{ user()?.fullName }}</p>
              <p class="text-xs text-slate-500">{{ user()?.email }}</p>
            </div>
            <button mat-menu-item (click)="logout()">
              <mat-icon class="text-rose-500">logout</mat-icon>
              <span class="font-medium text-slate-700">Logout</span>
            </button>
          </mat-menu>
        </div>
      </mat-toolbar>

      <div class="flex flex-1 overflow-hidden">
        <!-- Sidebar Navigation -->
        <div class="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 shadow-xl">
          <mat-nav-list class="flex-1 !pt-4 space-y-1.5 px-3">
            <a mat-list-item 
               routerLink="/dashboard" 
               routerLinkActive="active-nav-item"
               class="navigation-link !rounded-xl">
              <mat-icon matListItemIcon class="!text-slate-400">dashboard</mat-icon>
              <span matListItemTitle class="font-semibold text-sm font-sans tracking-wide">Dashboard</span>
            </a>

            <a mat-list-item 
               routerLink="/assets" 
               routerLinkActive="active-nav-item"
               class="navigation-link !rounded-xl">
              <mat-icon matListItemIcon class="!text-slate-400">inventory_2</mat-icon>
              <span matListItemTitle class="font-semibold text-sm font-sans tracking-wide">Assets</span>
            </a>

            <a mat-list-item 
               routerLink="/organization-units" 
               routerLinkActive="active-nav-item"
               class="navigation-link !rounded-xl">
              <mat-icon matListItemIcon class="!text-slate-400">account_tree</mat-icon>
              <span matListItemTitle class="font-semibold text-sm font-sans tracking-wide">Organization Tree</span>
            </a>
          </mat-nav-list>

          <!-- Sidebar Footer -->
          <div class="p-4 border-t border-slate-800/80 bg-slate-950/60 flex flex-col items-center text-center">
            <span class="text-[11px] text-slate-400 font-sans font-medium tracking-wide">RARAS Technologies PLC</span>
            <span class="text-[10px] text-slate-500 font-sans font-light">Cybersecurity & Enterprise IT</span>
          </div>
        </div>

        <!-- Main Content Area -->
        <main class="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-8">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .navigation-link {
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      margin-bottom: 2px;
    }
    .navigation-link:hover {
      background-color: rgba(255, 255, 255, 0.06) !important;
      color: #f8fafc !important;
    }
    ::ng-deep .active-nav-item {
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%) !important;
      color: #38bdf8 !important;
      border-left: 3px solid #0ea5e9 !important;
    }
    ::ng-deep .active-nav-item .mat-icon {
      color: #38bdf8 !important;
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
