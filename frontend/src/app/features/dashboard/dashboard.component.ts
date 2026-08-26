import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/services/auth.service';
import { AssetService } from '../../core/services/asset.service';
import { OrganizationUnitService } from '../../core/services/organization-unit.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatButtonModule],
  template: `
    <div class="space-y-7 animate-fade-in">

      <!-- Welcome header -->
      <div class="welcome-header">
        <div>
          <p class="text-xs font-semibold uppercase tracking-widest text-indigo-300 mb-1">Welcome back</p>
          <h1 class="text-2xl font-bold text-white tracking-tight leading-none">
            {{ user()?.fullName }}
          </h1>
          <p class="mt-1.5 text-sm text-slate-300 max-w-xl">
            Signed in as <span class="font-semibold text-white">{{ user()?.role }}</span>
            &mdash; <span class="text-slate-400">{{ user()?.organizationUnitName || 'Global' }}</span>
          </p>
        </div>
        <div class="welcome-badge hidden md:flex">
          <mat-icon class="text-indigo-300! text-[32px]! w-8! h-8!">shield</mat-icon>
        </div>
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">

        <div class="stat-card">
          <div class="stat-icon-wrap" style="background:#eef2ff">
            <mat-icon class="stat-icon" style="color:#6366f1">inventory_2</mat-icon>
          </div>
          <div>
            <p class="stat-label">Total Assets</p>
            <p class="stat-value">{{ totalAssets() }}</p>
          </div>
          <div class="stat-bar" style="background:#6366f1"></div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrap" style="background:#ecfeff">
            <mat-icon class="stat-icon" style="color:#06b6d4">account_tree</mat-icon>
          </div>
          <div>
            <p class="stat-label">Org Units</p>
            <p class="stat-value">{{ totalUnits() }}</p>
          </div>
          <div class="stat-bar" style="background:#06b6d4"></div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrap" style="background:#f0fdf4">
            <mat-icon class="stat-icon" style="color:#22c55e">fact_check</mat-icon>
          </div>
          <div>
            <p class="stat-label">Pending Actions</p>
            <p class="stat-value">0</p>
          </div>
          <div class="stat-bar" style="background:#22c55e"></div>
        </div>

      </div>

      <!-- Quick actions -->
      <div>
        <h2 class="section-title mb-3">Quick Actions</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">

          <a routerLink="/assets" class="action-card">
            <div class="action-icon-wrap" style="background:#eef2ff">
              <mat-icon style="color:#6366f1">list_alt</mat-icon>
            </div>
            <div>
              <p class="action-title">View Assets</p>
              <p class="action-sub">Browse the full asset registry</p>
            </div>
            <mat-icon class="action-arrow">chevron_right</mat-icon>
          </a>

          <a routerLink="/assets/create" *ngIf="isAdminOrManager()" class="action-card">
            <div class="action-icon-wrap" style="background:#f0fdf4">
              <mat-icon style="color:#22c55e">add_circle_outline</mat-icon>
            </div>
            <div>
              <p class="action-title">Register Asset</p>
              <p class="action-sub">Add a new asset to inventory</p>
            </div>
            <mat-icon class="action-arrow">chevron_right</mat-icon>
          </a>

          <a routerLink="/organization-units" class="action-card">
            <div class="action-icon-wrap" style="background:#ecfeff">
              <mat-icon style="color:#06b6d4">account_tree</mat-icon>
            </div>
            <div>
              <p class="action-title">Org Structure</p>
              <p class="action-sub">Manage organizational units</p>
            </div>
            <mat-icon class="action-arrow">chevron_right</mat-icon>
          </a>

        </div>
      </div>

    </div>
  `,
  styles: [`
    /* Welcome header */
    .welcome-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, #3730a3 0%, #1e1b4b 100%);
      border-radius: 14px;
      padding: 28px 32px;
      border: 1px solid rgba(99,102,241,0.25);
    }
    .welcome-badge {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: rgba(99,102,241,0.18);
      align-items: center;
      justify-content: center;
      border: 1px solid rgba(99,102,241,0.3);
    }

    /* Section title */
    .section-title {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    /* Stat cards */
    .stat-card {
      position: relative;
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e9edf2;
      padding: 18px 20px 22px;
      display: flex;
      align-items: center;
      gap: 16px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgb(0 0 0/.05);
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .stat-card:hover {
      box-shadow: 0 6px 20px -4px rgb(0 0 0/.1);
      transform: translateY(-1px);
    }
    .stat-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .stat-icon {
      font-size: 22px !important;
      width: 22px !important;
      height: 22px !important;
    }
    .stat-label {
      font-size: 12px;
      font-weight: 500;
      color: #64748b;
      margin: 0;
    }
    .stat-value {
      font-size: 26px;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.1;
      margin: 2px 0 0;
      font-family: 'Outfit', sans-serif;
    }
    .stat-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
    }

    /* Action cards */
    .action-card {
      display: flex;
      align-items: center;
      gap: 14px;
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e9edf2;
      padding: 16px 18px;
      text-decoration: none;
      cursor: pointer;
      transition: box-shadow 0.2s, border-color 0.2s, transform 0.2s;
      box-shadow: 0 1px 3px rgb(0 0 0/.05);
    }
    .action-card:hover {
      border-color: #6366f1;
      box-shadow: 0 4px 16px -4px rgb(99 102 241/.2);
      transform: translateY(-1px);
    }
    .action-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .action-title {
      font-size: 13.5px;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }
    .action-sub {
      font-size: 11.5px;
      color: #64748b;
      margin: 2px 0 0;
    }
    .action-arrow {
      margin-left: auto;
      color: #cbd5e1 !important;
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
      flex-shrink: 0;
    }
  `]
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
