import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AssetService } from '../../../core/services/asset.service';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import { AssetDto, AssetCategoryDto } from '../../../core/models/models';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="space-y-5 animate-fade-in">

      <!-- Page header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 class="page-title">Organization Assets</h1>
          <p class="page-sub">Track and manage your physical and digital assets</p>
        </div>
        <a mat-flat-button routerLink="/assets/create" *ngIf="isAdminOrManager()" class="primary-btn">
          <mat-icon class="btn-icon">add</mat-icon>
          Register Asset
        </a>
      </div>

      <!-- Filters -->
      <div class="filter-card">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <mat-form-field appearance="outline" class="w-full">
            <mat-icon matPrefix class="field-pfx">search</mat-icon>
            <input matInput [formControl]="searchControl" placeholder="Search assets…">
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Category</mat-label>
            <mat-select [formControl]="categoryControl">
              <mat-option [value]="null">All Categories</mat-option>
              <mat-option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.name }}</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Status</mat-label>
            <mat-select [formControl]="statusControl">
              <mat-option [value]="null">All Statuses</mat-option>
              <mat-option value="Active">Active</mat-option>
              <mat-option value="InRepair">In Repair</mat-option>
              <mat-option value="InStorage">In Storage</mat-option>
              <mat-option value="Retired">Retired</mat-option>
              <mat-option value="Disposed">Disposed</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <!-- Table card -->
      <div class="table-card">
        <mat-progress-bar *ngIf="loading()" mode="query" class="absolute top-0 left-0 right-0 rounded-t-xl"></mat-progress-bar>

        <div class="overflow-x-auto">
          <table mat-table [dataSource]="assets()" class="w-full">

            <!-- Tag -->
            <ng-container matColumnDef="assetTag">
              <th mat-header-cell *matHeaderCellDef>Tag</th>
              <td mat-cell *matCellDef="let row">
                <span class="tag-badge">{{ row.assetTag }}</span>
              </td>
            </ng-container>

            <!-- Name -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Name</th>
              <td mat-cell *matCellDef="let row">
                <p class="asset-name">{{ row.name }}</p>
                <p class="asset-sn" *ngIf="row.serialNumber">S/N {{ row.serialNumber }}</p>
              </td>
            </ng-container>

            <!-- Category -->
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let row" class="cell-muted">{{ row.categoryName }}</td>
            </ng-container>

            <!-- Org unit -->
            <ng-container matColumnDef="orgUnit">
              <th mat-header-cell *matHeaderCellDef>Org Unit</th>
              <td mat-cell *matCellDef="let row" class="cell-muted">{{ row.organizationUnitName }}</td>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let row">
                <span class="status-badge" [ngClass]="getStatusClass(row.status)">
                  {{ formatStatus(row.status) }}
                </span>
              </td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="text-right">Actions</th>
              <td mat-cell *matCellDef="let row" class="text-right whitespace-nowrap">
                <button mat-icon-button [routerLink]="['/assets/detail', row.id]"
                        title="View details" class="icon-btn-view">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button [routerLink]="['/assets/edit', row.id]"
                        *ngIf="isAdminOrManager()" title="Edit" class="icon-btn-edit">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button (click)="onDeleteAsset(row)"
                        *ngIf="isAdminOrManager()" title="Delete" class="icon-btn-delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>

          <!-- Empty state -->
          <div *ngIf="assets().length === 0 && !loading()" class="empty-state">
            <mat-icon class="empty-icon">inventory_2</mat-icon>
            <p class="empty-title">No assets found</p>
            <p class="empty-sub">Try adjusting your search or filter criteria</p>
          </div>
        </div>

        <mat-paginator
          [length]="totalCount()"
          [pageSize]="pageSize()"
          [pageIndex]="pageIndex()"
          [pageSizeOptions]="[5, 10, 20]"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      </div>

    </div>
  `,
  styles: [`
    .page-title  { font-size: 20px; font-weight: 700; color: #0f172a; }
    .page-sub    { font-size: 13px; color: #64748b; margin-top: 2px; }

    /* Primary button */
    .primary-btn {
      height: 38px !important;
      font-size: 13px !important;
      font-weight: 600 !important;
      border-radius: 8px !important;
      background: linear-gradient(135deg, #6366f1, #4f46e5) !important;
      color: #fff !important;
      box-shadow: 0 2px 8px rgb(99 102 241/.3) !important;
      gap: 4px;
    }
    .primary-btn:hover { opacity: 0.9 !important; }
    .btn-icon { font-size: 17px !important; width: 17px !important; height: 17px !important; }

    /* Filter card */
    .filter-card {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e9edf2;
      padding: 18px 20px;
      box-shadow: 0 1px 3px rgb(0 0 0/.05);
    }
    .field-pfx {
      font-size: 17px !important;
      width: 17px !important;
      height: 17px !important;
      color: #94a3b8;
    }

    /* Table card */
    .table-card {
      position: relative;
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e9edf2;
      overflow: hidden;
      box-shadow: 0 1px 3px rgb(0 0 0/.05);
    }

    /* Asset tag */
    .tag-badge {
      font-size: 11.5px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      background: #eef2ff;
      color: #4f46e5;
      font-family: 'Outfit', monospace;
      letter-spacing: 0.04em;
    }

    /* Asset name/sn */
    .asset-name { font-size: 13.5px; font-weight: 600; color: #0f172a; margin: 0; }
    .asset-sn   { font-size: 11px; color: #94a3b8; margin: 2px 0 0; }
    .cell-muted { font-size: 13px !important; color: #64748b !important; }

    /* Status badge */
    .status-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 20px;
      letter-spacing: 0.02em;
    }
    .status-active   { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }
    .status-repair   { background:#fffbeb; color:#b45309; border:1px solid #fde68a; }
    .status-storage  { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }
    .status-retired  { background:#f8fafc; color:#475569; border:1px solid #e2e8f0; }
    .status-disposed { background:#fff1f2; color:#be123c; border:1px solid #fecdd3; }

    /* Icon buttons */
    .icon-btn-view { color: #6366f1 !important; }
    .icon-btn-edit { color: #06b6d4 !important; }
    .icon-btn-delete { color: #f43f5e !important; }
    .icon-btn-delete:hover { background: #fff1f2 !important; }

    /* Empty state */
    .empty-state { text-align: center; padding: 56px 24px; }
    .empty-icon  { font-size: 48px !important; width: 48px !important; height: 48px !important; color: #cbd5e1 !important; }
    .empty-title { font-size: 14px; font-weight: 600; color: #475569; margin: 12px 0 4px; }
    .empty-sub   { font-size: 12.5px; color: #94a3b8; }
  `]
})
export class AssetListComponent implements OnInit {
  private readonly assetService = inject(AssetService);
  private readonly categoryService = inject(CategoryService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly searchControl   = new FormControl('');
  readonly categoryControl = new FormControl<string | null>(null);
  readonly statusControl   = new FormControl<string | null>(null);

  readonly assets     = signal<AssetDto[]>([]);
  readonly categories = signal<AssetCategoryDto[]>([]);
  readonly loading    = signal(false);
  readonly totalCount = signal(0);
  readonly pageSize   = signal(10);
  readonly pageIndex  = signal(0);

  readonly displayedColumns = ['assetTag', 'name', 'category', 'orgUnit', 'status', 'actions'];

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe(cats => this.categories.set(cats));
    this.loadAssets();

    this.searchControl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => {
      this.pageIndex.set(0);
      this.loadAssets();
    });
    this.categoryControl.valueChanges.subscribe(() => { this.pageIndex.set(0); this.loadAssets(); });
    this.statusControl.valueChanges.subscribe(() => { this.pageIndex.set(0); this.loadAssets(); });
  }

  loadAssets(): void {
    this.loading.set(true);
    this.assetService.getAssets(
      this.pageIndex() + 1,
      this.pageSize(),
      this.searchControl.value ?? undefined,
      this.categoryControl.value ?? undefined,
      this.statusControl.value ?? undefined
    ).subscribe({
      next: (result) => {
        this.assets.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadAssets();
  }

  isAdminOrManager(): boolean {
    const role = this.authService.currentUser()?.role;
    return role === 'Administrator' || role === 'Manager';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active':    return 'status-badge status-active';
      case 'InRepair':  return 'status-badge status-repair';
      case 'InStorage': return 'status-badge status-storage';
      case 'Retired':   return 'status-badge status-retired';
      case 'Disposed':  return 'status-badge status-disposed';
      default:          return 'status-badge status-retired';
    }
  }

  formatStatus(status: string): string {
    if (status === 'InRepair')  return 'In Repair';
    if (status === 'InStorage') return 'In Storage';
    return status;
  }

  onDeleteAsset(asset: AssetDto): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '90vw',
      maxWidth: '450px',
      data: {
        title: 'Delete Asset',
        message: `Are you sure you want to delete "${asset.name}" (${asset.assetTag})? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.loading.set(true);
        this.assetService.deleteAsset(asset.id).subscribe({
          next: () => {
            this.loading.set(false);
            this.snackBar.open('Asset deleted successfully.', 'Close', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
            this.loadAssets();
          },
          error: (err) => {
            this.loading.set(false);
            const message = err.error?.message || 'Error deleting asset. You may not have permission to delete this asset.';
            this.snackBar.open(message, 'Close', {
              duration: 5000,
              horizontalPosition: 'end',
              verticalPosition: 'top'
            });
          }
        });
      }
    });
  }
}
