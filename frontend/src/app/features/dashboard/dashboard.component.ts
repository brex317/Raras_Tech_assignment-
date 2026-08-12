import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';
import { AssetService } from '../../core/services/asset.service';
import { OrganizationUnitService } from '../../core/services/organization-unit.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="space-y-8 animate-fade-in">
      <!-- Welcome Header -->
      <div class="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-3xl p-6 md:p-8 text-white shadow-lg border border-indigo-600/20">
        <h1 class="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Welcome back, {{ user()?.fullName }}!</h1>
        <p class="text-indigo-200 text-sm md:text-base font-light max-w-2xl font-sans">
          You are logged in as <span class="font-semibold text-white">{{ user()?.role }}</span> assigned to the 
          <span class="font-semibold text-white">{{ user()?.organizationUnitName || 'Global' }}</span> unit. Use the quick controls below to navigate systems.
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Card 1 -->
        <mat-card class="!p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-slate-500 font-medium text-sm font-sans block">Total Assets</span>
              <span class="text-3xl font-extrabold text-slate-800">{{ totalAssets() }}</span>
            </div>
            <div class="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-colors">
              <mat-icon class="text-indigo-600 !w-8 !h-8 !text-[32px]">computer</mat-icon>
            </div>
          </div>
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500"></div>
        </mat-card>

        <!-- Card 2 -->
        <mat-card class="!p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-slate-500 font-medium text-sm font-sans block">Organization Units</span>
              <span class="text-3xl font-extrabold text-slate-800">{{ totalUnits() }}</span>
            </div>
            <div class="p-3 bg-cyan-50 rounded-xl group-hover:bg-cyan-100 transition-colors">
              <mat-icon class="text-cyan-600 !w-8 !h-8 !text-[32px]">account_tree</mat-icon>
            </div>
          </div>
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500"></div>
        </mat-card>

        <!-- Card 3 -->
        <mat-card class="!p-6 relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div class="flex items-center justify-between">
            <div class="space-y-1">
              <span class="text-slate-500 font-medium text-sm font-sans block">Pending Actions</span>
              <span class="text-3xl font-extrabold text-slate-800">0</span>
            </div>
            <div class="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
              <mat-icon class="text-emerald-600 !w-8 !h-8 !text-[32px]">fact_check</mat-icon>
            </div>
          </div>
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </mat-card>
      </div>

      <!-- Quick Actions -->
      <div class="space-y-4">
        <h2 class="text-xl font-bold text-slate-800 font-sans">Quick Actions</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <a mat-raised-button color="primary" routerLink="/assets" class="!py-6 !rounded-xl shadow-sm text-center">
            <mat-icon class="mr-1">list</mat-icon> View Assets List
          </a>
          <a mat-raised-button color="accent" routerLink="/assets/create" *ngIf="isAdminOrManager()" class="!py-6 !rounded-xl shadow-sm text-center">
            <mat-icon class="mr-1">add_circle</mat-icon> Register New Asset
          </a>
          <a mat-raised-button color="primary" routerLink="/organization-units" class="!py-6 !rounded-xl shadow-sm text-center">
            <mat-icon class="mr-1">account_tree</mat-icon> Organization Tree
          </a>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly assetService = inject(AssetService);
  private readonly orgUnitService = inject(OrganizationUnitService);

  readonly user = this.authService.currentUser;
  readonly totalAssets = signal(0);
  readonly totalUnits = signal(0);

  ngOnInit(): void {
    this.assetService.getAssets(1, 1).subscribe(res => {
      this.totalAssets.set(res.totalCount);
    });

    this.orgUnitService.getAll().subscribe(res => {
      this.totalUnits.set(res.length);
    });
  }

  isAdminOrManager(): boolean {
    const role = this.user()?.role;
    return role === 'Administrator' || role === 'Manager';
  }
}
