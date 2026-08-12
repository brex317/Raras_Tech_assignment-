import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AssetService } from '../../../core/services/asset.service';
import { CategoryService } from '../../../core/services/category.service';
import { OrgUnitSelectorComponent } from '../../../shared/components/org-unit-selector/org-unit-selector.component';
import { AssetCategoryDto } from '../../../core/models/models';

@Component({
  selector: 'app-asset-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    OrgUnitSelectorComponent
  ],
  template: `
    <div class="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <!-- Title Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-800 font-sans tracking-tight">
            {{ isEditMode() ? 'Edit Asset' : 'Register New Asset' }}
          </h1>
          <p class="text-sm text-slate-500 font-sans">
            {{ isEditMode() ? 'Update existing asset details and assignment' : 'Add a new asset to organization inventory' }}
          </p>
        </div>
      </div>

      <!-- Form Card -->
      <mat-card class="!p-8 relative">
        <mat-progress-bar *ngIf="loading()" mode="query" class="absolute top-0 left-0 right-0 rounded-t-2xl"></mat-progress-bar>
        
        <form [formGroup]="assetForm" (ngSubmit)="onSubmit()" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Asset Name -->
            <mat-form-field appearance="outline" class="w-full md:col-span-2">
              <mat-label>Asset Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g. MacBook Pro 16-inch" required>
              <mat-error *ngIf="assetForm.get('name')?.hasError('required')">Asset name is required</mat-error>
              <mat-error *ngIf="assetForm.get('name')?.hasError('maxlength')">Name must not exceed 200 characters</mat-error>
            </mat-form-field>

            <!-- Category -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Asset Category</mat-label>
              <mat-select formControlName="categoryId" required>
                <mat-option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.name }}</mat-option>
              </mat-select>
              <mat-error *ngIf="assetForm.get('categoryId')?.hasError('required')">Category is required</mat-error>
            </mat-form-field>

            <!-- Status (Edit Mode Only) -->
            <mat-form-field appearance="outline" class="w-full" *ngIf="isEditMode()">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option [value]="0">Active</mat-option>
                <mat-option [value]="1">In Repair</mat-option>
                <mat-option [value]="2">In Storage</mat-option>
                <mat-option [value]="3">Retired</mat-option>
                <mat-option [value]="4">Disposed</mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Organization Unit (Reassignment Selector) -->
            <app-org-unit-selector 
              formControlName="organizationUnitId"
              [required]="true"
              label="Organization Unit Owner"
              class="w-full md:col-span-2">
            </app-org-unit-selector>

            <!-- Description -->
            <mat-form-field appearance="outline" class="w-full md:col-span-2">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="description" rows="3" placeholder="Add useful asset details..."></textarea>
            </mat-form-field>

            <!-- Serial Number -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Serial Number (S/N)</mat-label>
              <input matInput formControlName="serialNumber" placeholder="e.g. SN-89736">
            </mat-form-field>

            <!-- Purchase Cost -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Purchase Cost (USD)</mat-label>
              <input matInput type="number" formControlName="purchaseCost" placeholder="0.00" min="0">
              <span matPrefix class="mr-1">$</span>
              <mat-error *ngIf="assetForm.get('purchaseCost')?.hasError('min')">Cost must be a positive value</mat-error>
            </mat-form-field>

            <!-- Purchase Date -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Purchase Date</mat-label>
              <input matInput [matDatepicker]="purchaseDatePicker" formControlName="purchaseDate">
              <mat-datepicker-toggle matSuffix [for]="purchaseDatePicker"></mat-datepicker-toggle>
              <mat-datepicker #purchaseDatePicker></mat-datepicker>
            </mat-form-field>

            <!-- Warranty Expiry Date -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Warranty Expiry Date</mat-label>
              <input matInput [matDatepicker]="warrantyDatePicker" formControlName="warrantyExpiryDate">
              <mat-datepicker-toggle matSuffix [for]="warrantyDatePicker"></mat-datepicker-toggle>
              <mat-datepicker #warrantyDatePicker></mat-datepicker>
            </mat-form-field>
            
          </div>

          <!-- Buttons -->
          <div class="flex justify-end space-x-4 pt-4 border-t border-slate-100">
            <button mat-button type="button" routerLink="/assets" [disabled]="loading()">Cancel</button>
            <button mat-raised-button color="primary" type="submit" [disabled]="assetForm.invalid || loading()" class="!rounded-lg !px-6 shadow">
              {{ isEditMode() ? 'Save Changes' : 'Register Asset' }}
            </button>
          </div>
        </form>
      </mat-card>
    </div>
  `
})
export class AssetFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly assetService = inject(AssetService);
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly isEditMode = signal(false);
  readonly loading = signal(false);
  readonly categories = signal<AssetCategoryDto[]>([]);
  assetId?: string;

  readonly assetForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: [''],
    status: [0],
    serialNumber: [''],
    purchaseDate: [null as Date | null],
    purchaseCost: [null as number | null, [Validators.min(0)]],
    warrantyExpiryDate: [null as Date | null],
    categoryId: ['', [Validators.required]],
    organizationUnitId: ['', [Validators.required]]
  });

  ngOnInit(): void {
    // Load categories
    this.categoryService.getCategories().subscribe(cats => this.categories.set(cats));

    // Check if Edit Mode
    this.assetId = this.route.snapshot.params['id'];
    if (this.assetId) {
      this.isEditMode.set(true);
      this.loadAssetData(this.assetId);
    }
  }

  private loadAssetData(id: string): void {
    this.loading.set(true);
    this.assetService.getAssetById(id).subscribe({
      next: (asset) => {
        // Map status enum string back to index
        const statusMap: Record<string, number> = {
          'Active': 0,
          'InRepair': 1,
          'InStorage': 2,
          'Retired': 3,
          'Disposed': 4
        };

        this.assetForm.patchValue({
          name: asset.name,
          description: asset.description,
          status: statusMap[asset.status] ?? 0,
          serialNumber: asset.serialNumber,
          purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate) : null,
          purchaseCost: asset.purchaseCost,
          warrantyExpiryDate: asset.warrantyExpiryDate ? new Date(asset.warrantyExpiryDate) : null,
          categoryId: asset.categoryId,
          organizationUnitId: asset.organizationUnitId
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error loading asset data.', 'Close', { duration: 4000 });
        this.router.navigate(['/assets']);
      }
    });
  }

  onSubmit(): void {
    if (this.assetForm.invalid) {
      return;
    }

    this.loading.set(true);
    const formValue = this.assetForm.value;

    const request = {
      name: formValue.name,
      description: formValue.description,
      status: Number(formValue.status),
      serialNumber: formValue.serialNumber,
      purchaseDate: formValue.purchaseDate ? new Date(formValue.purchaseDate).toISOString() : null,
      purchaseCost: formValue.purchaseCost,
      warrantyExpiryDate: formValue.warrantyExpiryDate ? new Date(formValue.warrantyExpiryDate).toISOString() : null,
      categoryId: formValue.categoryId,
      organizationUnitId: formValue.organizationUnitId
    };

    if (this.isEditMode() && this.assetId) {
      this.assetService.updateAsset(this.assetId, request).subscribe({
        next: () => {
          this.loading.set(false);
          this.snackBar.open('Asset updated successfully.', 'Close', { duration: 3000 });
          this.router.navigate(['/assets']);
        },
        error: (err) => {
          this.loading.set(false);
          this.snackBar.open(err.error?.message || 'Error updating asset.', 'Close', { duration: 4000 });
        }
      });
    } else {
      this.assetService.createAsset(request).subscribe({
        next: () => {
          this.loading.set(false);
          this.snackBar.open('Asset registered successfully.', 'Close', { duration: 3000 });
          this.router.navigate(['/assets']);
        },
        error: (err) => {
          this.loading.set(false);
          this.snackBar.open(err.error?.message || 'Error registering asset.', 'Close', { duration: 4000 });
        }
      });
    }
  }
}
