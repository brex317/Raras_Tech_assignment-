import { Component, inject, OnInit, signal, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { AssetService } from '../../../core/services/asset.service';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import { AssetDto, AssetCategoryDto } from '../../../core/models/models';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-asset-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  template: `
    <div class="space-y-6 animate-fade-in">
      
      <!-- Top Title and Action -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-800 font-sans tracking-tight">Organization Assets</h1>
          <p class="text-sm text-slate-500 font-sans">Track and manage your organization's physical and digital assets</p>
        </div>
        <a mat-raised-button color="primary" routerLink="/assets/create" *ngIf="isAdminOrManager()" class="!rounded-xl shadow-sm">
          <mat-icon class="mr-1">add</mat-icon> Register Asset
        </a>
      </div>

      <!-- Filters Panel -->
      <mat-card class="!p-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <!-- Text Search -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Search assets</mat-label>
            <input matInput [formControl]="searchControl" placeholder="Search by name, tag, or serial...">
            <mat-icon matSuffix class="text-slate-400">search</mat-icon>
          </mat-form-field>

          <!-- Category Filter -->
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Category</mat-label>
            <mat-select [formControl]="categoryControl">
              <mat-option [value]="null">All Categories</mat-option>
              <mat-option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.name }}</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Status Filter -->
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
      </mat-card>

      <!-- Assets Table -->
      <mat-card class="overflow-hidden relative">
        <mat-progress-bar *ngIf="loading()" mode="query" class="absolute top-0 left-0 right-0 z-10"></mat-progress-bar>
        
        <div class="overflow-x-auto">
          <table mat-table [dataSource]="assets()" class="w-full">
            
            <!-- Asset Tag -->
            <ng-container matColumnDef="assetTag">
              <th mat-header-cell *matHeaderCellDef class="!font-bold !text-slate-700">Tag</th>
              <td mat-cell *matCellDef="let element" class="!font-semibold text-indigo-600 font-sans">
                {{ element.assetTag }}
              </td>
            </ng-container>

            <!-- Name -->
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef class="!font-bold !text-slate-700">Name</th>
              <td mat-cell *matCellDef="let element" class="!font-semibold text-slate-800">
                <div class="flex flex-col">
                  <span>{{ element.name }}</span>
                  <span class="text-xs text-slate-400 font-normal font-sans" *ngIf="element.serialNumber">S/N: {{ element.serialNumber }}</span>
                </div>
              </td>
            </ng-container>

            <!-- Category -->
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef class="!font-bold !text-slate-700">Category</th>
              <td mat-cell *matCellDef="let element" class="text-slate-600">{{ element.categoryName }}</td>
            </ng-container>

            <!-- Org Unit -->
            <ng-container matColumnDef="orgUnit">
              <th mat-header-cell *matHeaderCellDef class="!font-bold !text-slate-700">Organization Unit</th>
              <td mat-cell *matCellDef="let element" class="text-slate-600 font-sans">{{ element.organizationUnitName }}</td>
            </ng-container>

            <!-- Status -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef class="!font-bold !text-slate-700">Status</th>
              <td mat-cell *matCellDef="let element">
                <span class="px-2 py-1 text-xs font-bold rounded-full" [ngClass]="getStatusClass(element.status)">
                  {{ formatStatus(element.status) }}
                </span>
              </td>
            </ng-container>

            <!-- Actions -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="!font-bold !text-slate-700 text-right">Actions</th>
              <td mat-cell *matCellDef="let element" class="text-right whitespace-nowrap">
                <button mat-icon-button color="primary" [routerLink]="['/assets/detail', element.id]" title="View details">
                  <mat-icon>visibility</mat-icon>
                </button>
                <button mat-icon-button color="accent" [routerLink]="['/assets/edit', element.id]" *ngIf="isAdminOrManager()" title="Edit asset">
                  <mat-icon>edit</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="hover:bg-slate-50 transition-colors"></tr>
          </table>

          <!-- Empty State -->
          <div *ngIf="assets().length === 0 && !loading()" class="text-center py-12">
            <mat-icon class="!text-slate-300 !w-16 !h-16 !text-[64px] mb-4">computer</mat-icon>
            <p class="text-slate-500 font-medium font-sans">No assets found matching filters</p>
          </div>
        </div>

        <mat-paginator 
          [length]="totalCount()" 
          [pageSize]="pageSize()" 
          [pageIndex]="pageIndex()"
          [pageSizeOptions]="[5, 10, 20]" 
          (page)="onPageChange($event)"
          showFirstLastButtons
          class="border-t border-slate-100">
        </mat-paginator>
      </mat-card>
    </div>
  `
})
export class AssetListComponent implements OnInit {
  private readonly assetService = inject(AssetService);
  private readonly categoryService = inject(CategoryService);
  private readonly authService = inject(AuthService);

  // Form controls
  readonly searchControl = new FormControl('');
  readonly categoryControl = new FormControl<string | null>(null);
  readonly statusControl = new FormControl<string | null>(null);

  // Signals
  readonly assets = signal<AssetDto[]>([]);
  readonly categories = signal<AssetCategoryDto[]>([]);
  readonly loading = signal(false);
  readonly totalCount = signal(0);
  readonly pageSize = signal(10);
  readonly pageIndex = signal(0);

  readonly displayedColumns = ['assetTag', 'name', 'category', 'orgUnit', 'status', 'actions'];

  ngOnInit(): void {
    // Load categories
    this.categoryService.getCategories().subscribe(cats => this.categories.set(cats));

    // Load initial asset list
    this.loadAssets();

    // Set up filter change listeners with debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => {
      this.pageIndex.set(0);
      this.loadAssets();
    });

    this.categoryControl.valueChanges.subscribe(() => {
      this.pageIndex.set(0);
      this.loadAssets();
    });

    this.statusControl.valueChanges.subscribe(() => {
      this.pageIndex.set(0);
      this.loadAssets();
    });
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
      error: () => {
        this.loading.set(false);
      }
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
      case 'Active':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'InRepair':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'InStorage':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Retired':
        return 'bg-slate-100 text-slate-800 border border-slate-200';
      case 'Disposed':
        return 'bg-rose-100 text-rose-800 border border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  }

  formatStatus(status: string): string {
    if (status === 'InRepair') return 'In Repair';
    if (status === 'InStorage') return 'In Storage';
    return status;
  }
}
