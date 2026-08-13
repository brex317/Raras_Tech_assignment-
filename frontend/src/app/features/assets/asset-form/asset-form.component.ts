import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
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
    <div class="max-w-3xl mx-auto space-y-0 animate-fade-in">

      <!-- ── Sticky page header ── -->
      <div class="page-header">
        <div class="flex items-center gap-3 min-w-0">
          <a routerLink="/assets" class="back-btn" title="Back to assets">
            <mat-icon class="!text-[18px] !w-[18px] !h-[18px]">arrow_back</mat-icon>
          </a>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <a routerLink="/assets" class="breadcrumb-link">Assets</a>
              <mat-icon class="breadcrumb-sep">chevron_right</mat-icon>
              <span class="breadcrumb-current">{{ isEditMode() ? 'Edit Asset' : 'Register Asset' }}</span>
            </div>
            <h1 class="page-title">{{ isEditMode() ? 'Edit Asset' : 'Register New Asset' }}</h1>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <a routerLink="/assets" class="cancel-btn" [class.disabled]="loading()">Cancel</a>
          <button type="submit" form="assetForm" [disabled]="assetForm.invalid || loading()" class="submit-btn">
            <ng-container *ngIf="!loading()">
              <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">{{ isEditMode() ? 'save' : 'add_circle_outline' }}</mat-icon>
              {{ isEditMode() ? 'Save Changes' : 'Register Asset' }}
            </ng-container>
            <ng-container *ngIf="loading()">
              <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              Saving…
            </ng-container>
          </button>
        </div>
      </div>

      <!-- ── Form ── -->
      <form id="assetForm" [formGroup]="assetForm" (ngSubmit)="onSubmit()" class="space-y-4 pt-5">

        <!-- Loading bar (full-width above first card) -->
        <div class="loading-bar-wrap" *ngIf="loading()">
          <mat-progress-bar mode="query"></mat-progress-bar>
        </div>

        <!-- ── Section 1: Identity ── -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-icon-wrap" style="background:#eef2ff">
              <mat-icon class="section-icon" style="color:#6366f1">inventory_2</mat-icon>
            </div>
            <div>
              <p class="section-title">Asset Identity</p>
              <p class="section-sub">Core details and classification</p>
            </div>
          </div>

          <div class="fields-grid">

            <!-- Row 1: Asset name + Category -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Asset Name</mat-label>
              <input matInput formControlName="name" placeholder="e.g. MacBook Pro 16-inch" required>
              <mat-error *ngIf="assetForm.get('name')?.hasError('required')">Name is required</mat-error>
              <mat-error *ngIf="assetForm.get('name')?.hasError('maxlength')">Max 200 characters</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Category</mat-label>
              <mat-select formControlName="categoryId" required>
                <mat-option *ngFor="let cat of categories()" [value]="cat.id">{{ cat.name }}</mat-option>
              </mat-select>
              <mat-error *ngIf="assetForm.get('categoryId')?.hasError('required')">Category is required</mat-error>
            </mat-form-field>

            <!-- Status (edit only) — spans full row so layout stays even -->
            <mat-form-field appearance="outline" class="w-full col-span-2" *ngIf="isEditMode()">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option [value]="0">
                  <span class="opt-dot" style="background:#22c55e"></span> Active
                </mat-option>
                <mat-option [value]="1">
                  <span class="opt-dot" style="background:#f59e0b"></span> In Repair
                </mat-option>
                <mat-option [value]="2">
                  <span class="opt-dot" style="background:#3b82f6"></span> In Storage
                </mat-option>
                <mat-option [value]="3">
                  <span class="opt-dot" style="background:#94a3b8"></span> Retired
                </mat-option>
                <mat-option [value]="4">
                  <span class="opt-dot" style="background:#f43f5e"></span> Disposed
                </mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Row 2: Org Unit + Serial Number -->
            <app-org-unit-selector
              formControlName="organizationUnitId"
              [required]="true"
              label="Organization Unit"
              class="w-full">
            </app-org-unit-selector>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Serial Number</mat-label>
              <input matInput formControlName="serialNumber" placeholder="e.g. SN-89736">
            </mat-form-field>

            <!-- Description — full width -->
            <div class="col-span-2">
              <mat-form-field appearance="outline" class="w-full">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="3"
                          placeholder="Optional notes or additional details about this asset…"
                          class="!resize-none"></textarea>
              </mat-form-field>
            </div>

          </div>
        </div>

        <!-- ── Section 2: Procurement ── -->
        <div class="section-card">
          <div class="section-header">
            <div class="section-icon-wrap" style="background:#f0fdf4">
              <mat-icon class="section-icon" style="color:#22c55e">payments</mat-icon>
            </div>
            <div>
              <p class="section-title">Procurement & Warranty</p>
              <p class="section-sub">Financial and coverage information</p>
            </div>
          </div>

          <div class="fields-grid">

            <!-- Purchase cost -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Purchase Cost</mat-label>
              <input matInput type="number" formControlName="purchaseCost" placeholder="0.00" min="0">
              <mat-error *ngIf="assetForm.get('purchaseCost')?.hasError('min')">Must be a positive value</mat-error>
            </mat-form-field>

            <!-- Purchase date -->
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Purchase Date</mat-label>
              <input matInput [matDatepicker]="purchasePicker" formControlName="purchaseDate"
                     placeholder="DD/MM/YYYY">
              <mat-datepicker-toggle matIconSuffix [for]="purchasePicker"></mat-datepicker-toggle>
              <mat-datepicker #purchasePicker></mat-datepicker>
            </mat-form-field>

            <!-- Warranty expiry + tip in one flex row, full width -->
            <div class="warranty-row col-span-2">
              <mat-form-field appearance="outline" class="warranty-field">
                <mat-label>Warranty Expiry</mat-label>
                <input matInput [matDatepicker]="warrantyPicker" formControlName="warrantyExpiryDate"
                       placeholder="DD/MM/YYYY">
                <mat-datepicker-toggle matIconSuffix [for]="warrantyPicker"></mat-datepicker-toggle>
                <mat-datepicker #warrantyPicker></mat-datepicker>
              </mat-form-field>

              <div class="tip-box">
                <mat-icon class="tip-icon">lightbulb_outline</mat-icon>
                <p class="tip-text">Leave blank if this asset has no active warranty coverage.</p>
              </div>
            </div>

          </div>
        </div>

        <!-- ── Mobile-only action row ── -->
        <div class="mobile-actions">
          <a routerLink="/assets" class="cancel-btn w-full justify-center" [class.disabled]="loading()">Cancel</a>
          <button type="submit" [disabled]="assetForm.invalid || loading()" class="submit-btn w-full justify-center">
            <ng-container *ngIf="!loading()">{{ isEditMode() ? 'Save Changes' : 'Register Asset' }}</ng-container>
            <ng-container *ngIf="loading()">Saving…</ng-container>
          </button>
        </div>

      </form>

    </div>
  `,
  styles: [`
    /* ── Page header ── */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: #fff;
      border: 1px solid #e9edf2;
      border-radius: 12px;
      padding: 14px 20px;
      box-shadow: 0 1px 3px rgb(0 0 0/.05);
    }

    .back-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #64748b;
      text-decoration: none;
      flex-shrink: 0;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
    }
    .back-btn:hover { border-color: #6366f1; color: #6366f1; background: #eef2ff; }

    .breadcrumb-link {
      font-size: 12px;
      color: #6366f1;
      text-decoration: none;
      font-weight: 500;
    }
    .breadcrumb-link:hover { text-decoration: underline; }

    .breadcrumb-sep {
      font-size: 14px !important;
      width: 14px !important;
      height: 14px !important;
      color: #cbd5e1 !important;
    }

    .breadcrumb-current {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 500;
    }

    .page-title {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      margin: 2px 0 0;
      line-height: 1.2;
    }

    /* ── Loading bar ── */
    .loading-bar-wrap {
      border-radius: 4px;
      overflow: hidden;
    }

    /* ── Section card ── */
    .section-card {
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e9edf2;
      overflow: hidden;
      box-shadow: 0 1px 3px rgb(0 0 0/.05);
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px 24px;
      border-bottom: 1px solid #f1f5f9;
      background: #fafafa;
    }

    .section-icon-wrap {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .section-icon {
      font-size: 19px !important;
      width: 19px !important;
      height: 19px !important;
    }

    .section-title {
      font-size: 13.5px;
      font-weight: 600;
      color: #0f172a;
      margin: 0;
    }

    .section-sub {
      font-size: 11.5px;
      color: #94a3b8;
      margin: 1px 0 0;
    }

    /* ── Fields grid ── */
    .fields-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 16px;
      padding: 20px 24px 16px;
    }

    .col-span-2 { grid-column: span 2; }

    /* ── Warranty row — field + tip side by side ── */
    .warranty-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .warranty-field {
      flex: 1;
      min-width: 0;
    }

    /* ── Tip box ── */
    .tip-box {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      flex: 1;
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 8px;
      padding: 10px 14px;
      margin-top: 4px;            /* align with the top of the outline field */
      min-width: 0;
    }
    .tip-icon {
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: #f59e0b !important;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .tip-text {
      font-size: 11.5px;
      color: #92400e;
      margin: 0;
      line-height: 1.5;
    }

    /* ── Status option dots ── */
    .opt-dot {
      display: inline-block;
      width: 7px;
      height: 7px;
      border-radius: 50%;
      margin-right: 6px;
      vertical-align: middle;
    }

    /* ── Buttons ── */
    .cancel-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      height: 36px;
      padding: 0 16px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      background: #fff;
      font-size: 13px;
      font-weight: 500;
      color: #64748b;
      text-decoration: none;
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s;
      white-space: nowrap;
    }
    .cancel-btn:hover { border-color: #94a3b8; color: #334155; }
    .cancel-btn.disabled { opacity: 0.45; pointer-events: none; }

    .submit-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 36px;
      padding: 0 18px;
      border-radius: 8px;
      border: none;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      cursor: pointer;
      box-shadow: 0 2px 8px rgb(99 102 241/.3);
      transition: opacity 0.15s, box-shadow 0.15s;
      white-space: nowrap;
    }
    .submit-btn:hover:not(:disabled) { opacity: 0.9; box-shadow: 0 4px 14px rgb(99 102 241/.4); }
    .submit-btn:disabled { background: #e2e8f0; color: #94a3b8; box-shadow: none; cursor: not-allowed; }

    /* ── Mobile action row (visible only on small screens) ── */
    .mobile-actions {
      display: none;
      gap: 10px;
      padding-bottom: 8px;
    }

    @media (max-width: 639px) {
      .page-header .cancel-btn,
      .page-header .submit-btn { display: none; }
      .mobile-actions { display: flex; }
      .fields-grid { grid-template-columns: 1fr; }
      .col-span-2 { grid-column: span 1; }
      .tip-box { grid-column: span 1; }
    }
  `]
})
export class AssetFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly assetService = inject(AssetService);
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snackBar = inject(MatSnackBar);

  readonly isEditMode  = signal(false);
  readonly loading     = signal(false);
  readonly categories  = signal<AssetCategoryDto[]>([]);
  assetId?: string;

  readonly assetForm = this.fb.group({
    name:                ['', [Validators.required, Validators.maxLength(200)]],
    description:         [''],
    status:              [0],
    serialNumber:        [''],
    purchaseDate:        [null as Date | null],
    purchaseCost:        [null as number | null, [Validators.min(0)]],
    warrantyExpiryDate:  [null as Date | null],
    categoryId:          ['', [Validators.required]],
    organizationUnitId:  ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe(cats => this.categories.set(cats));

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
        const statusMap: Record<string, number> = { Active: 0, InRepair: 1, InStorage: 2, Retired: 3, Disposed: 4 };
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
    if (this.assetForm.invalid) return;
    this.loading.set(true);
    const fv = this.assetForm.value;

    const request = {
      name: fv.name,
      description: fv.description,
      status: Number(fv.status),
      serialNumber: fv.serialNumber,
      purchaseDate: fv.purchaseDate ? new Date(fv.purchaseDate).toISOString() : null,
      purchaseCost: fv.purchaseCost,
      warrantyExpiryDate: fv.warrantyExpiryDate ? new Date(fv.warrantyExpiryDate).toISOString() : null,
      categoryId: fv.categoryId,
      organizationUnitId: fv.organizationUnitId
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
