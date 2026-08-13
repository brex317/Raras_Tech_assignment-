import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AssetService } from '../../../core/services/asset.service';
import { DocumentService } from '../../../core/services/document.service';
import { AuthService } from '../../../core/services/auth.service';
import { AssetDetailDto, AssetDocumentDto } from '../../../core/models/models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-asset-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressBarModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="space-y-4 animate-fade-in" *ngIf="asset()">

      <!-- ── Hero header ── -->
      <div class="hero-header">
        <div class="hero-left">
          <div class="flex items-center gap-1.5 mb-3">
            <a routerLink="/assets" class="bc-link">Assets</a>
            <mat-icon class="bc-sep">chevron_right</mat-icon>
            <span class="bc-current truncate max-w-[200px]">{{ asset()?.name }}</span>
          </div>
          <div class="flex items-center gap-3 flex-wrap">
            <h1 class="hero-title">{{ asset()?.name }}</h1>
            <span class="status-badge" [ngClass]="getStatusClass(asset()!.status)">{{ formatStatus(asset()!.status) }}</span>
          </div>
          <div class="flex items-center gap-4 mt-2 flex-wrap">
            <span class="hero-meta">
              <mat-icon class="hero-meta-icon">label_outline</mat-icon>
              <span class="tag-badge-hero">{{ asset()?.assetTag }}</span>
            </span>
            <span class="hero-meta">
              <mat-icon class="hero-meta-icon">business</mat-icon>
              {{ asset()?.organizationUnitName }}
            </span>
            <span class="hero-meta">
              <mat-icon class="hero-meta-icon">category</mat-icon>
              {{ asset()?.categoryName }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2 shrink-0 mt-4 sm:mt-0">
          <a routerLink="/assets" class="ghost-btn">
            <mat-icon class="!text-[16px] !w-4 !h-4">arrow_back</mat-icon>Back
          </a>
          <a [routerLink]="['/assets/edit', asset()?.id]" *ngIf="isAdminOrManager()" class="primary-btn">
            <mat-icon class="!text-[16px] !w-4 !h-4">edit</mat-icon>Edit Asset
          </a>
        </div>
      </div>

      <!-- ── Summary row ── -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background:#eef2ff">
            <mat-icon style="color:#6366f1;font-size:18px;width:18px;height:18px">attach_money</mat-icon>
          </div>
          <div>
            <p class="kpi-label">Purchase Cost</p>
            <p class="kpi-value">{{ asset()?.purchaseCost ? (asset()?.purchaseCost | currency:'USD':'symbol':'1.0-0') : '—' }}</p>
          </div>
          <div class="kpi-bar" style="background:#6366f1"></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background:#f0fdf4">
            <mat-icon style="color:#22c55e;font-size:18px;width:18px;height:18px">calendar_today</mat-icon>
          </div>
          <div>
            <p class="kpi-label">Purchase Date</p>
            <p class="kpi-value kpi-value--sm">{{ (asset()?.purchaseDate | date:'MMM d, y') || '—' }}</p>
          </div>
          <div class="kpi-bar" style="background:#22c55e"></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap" [style]="isWarrantyExpired() ? 'background:#fff1f2' : 'background:#fffbeb'">
            <mat-icon [style]="isWarrantyExpired() ? 'color:#f43f5e;font-size:18px;width:18px;height:18px' : 'color:#f59e0b;font-size:18px;width:18px;height:18px'">verified_user</mat-icon>
          </div>
          <div>
            <p class="kpi-label">Warranty</p>
            <p class="kpi-value kpi-value--sm" [class.text-rose-500]="isWarrantyExpired()">
              {{ (asset()?.warrantyExpiryDate | date:'MMM d, y') || '—' }}
            </p>
            <p class="kpi-sub text-rose-500" *ngIf="isWarrantyExpired()">Expired</p>
            <p class="kpi-sub text-emerald-600" *ngIf="!isWarrantyExpired() && warrantyDaysLeft() > 0">{{ warrantyDaysLeft() }}d remaining</p>
          </div>
          <div class="kpi-bar" [style]="isWarrantyExpired() ? 'background:#f43f5e' : 'background:#f59e0b'"></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon-wrap" style="background:#ecfeff">
            <mat-icon style="color:#06b6d4;font-size:18px;width:18px;height:18px">folder_open</mat-icon>
          </div>
          <div>
            <p class="kpi-label">Documents</p>
            <p class="kpi-value">{{ asset()?.documents?.length || 0 }}<span class="kpi-unit">files</span></p>
          </div>
          <div class="kpi-bar" style="background:#06b6d4"></div>
        </div>
      </div>

      <!-- ── Tab card ── -->
      <div class="tab-card">
        <mat-progress-bar *ngIf="loading()" mode="query" class="absolute top-0 left-0 right-0"></mat-progress-bar>
        <mat-tab-group dynamicHeight>

          <!-- Overview -->
          <mat-tab>
            <ng-template mat-tab-label>
              <span class="tab-label"><mat-icon class="tab-icon">info_outline</mat-icon>Overview</span>
            </ng-template>
            <div class="tab-body">
              <div class="two-col-layout">
                <div class="prop-section">
                  <div class="prop-section-header"><div class="prop-section-dot" style="background:#6366f1"></div>Asset Details</div>
                  <div class="prop-list">
                    <div class="prop-row"><span class="prop-key">Asset Tag</span><span class="prop-val"><span class="tag-mono">{{ asset()?.assetTag }}</span></span></div>
                    <div class="prop-row"><span class="prop-key">Category</span><span class="prop-val">{{ asset()?.categoryName }}</span></div>
                    <div class="prop-row"><span class="prop-key">Serial Number</span><span class="prop-val font-mono text-xs tracking-wide">{{ asset()?.serialNumber || '—' }}</span></div>
                    <div class="prop-row"><span class="prop-key">Status</span><span class="prop-val"><span class="status-badge" [ngClass]="getStatusClass(asset()!.status)">{{ formatStatus(asset()!.status) }}</span></span></div>
                    <div class="prop-row"><span class="prop-key">Org Unit</span><span class="prop-val">{{ asset()?.organizationUnitName }}</span></div>
                    <div class="prop-row"><span class="prop-key">Registered</span><span class="prop-val text-slate-500">{{ asset()?.createdAt | date:'MMM d, y · h:mm a' }}</span></div>
                    <div class="prop-row" *ngIf="asset()?.updatedAt"><span class="prop-key">Last Updated</span><span class="prop-val text-slate-500">{{ asset()?.updatedAt | date:'MMM d, y · h:mm a' }}</span></div>
                  </div>
                </div>
                <div class="prop-section">
                  <div class="prop-section-header"><div class="prop-section-dot" style="background:#22c55e"></div>Procurement & Warranty</div>
                  <div class="prop-list">
                    <div class="prop-row"><span class="prop-key">Purchase Date</span><span class="prop-val">{{ (asset()?.purchaseDate | date:'MMM d, y') || '—' }}</span></div>
                    <div class="prop-row"><span class="prop-key">Purchase Cost</span><span class="prop-val font-semibold text-slate-800">{{ asset()?.purchaseCost ? (asset()?.purchaseCost | currency) : '—' }}</span></div>
                    <div class="prop-row"><span class="prop-key">Warranty Expiry</span><span class="prop-val" [class.text-rose-600]="isWarrantyExpired()">{{ (asset()?.warrantyExpiryDate | date:'MMM d, y') || '—' }}</span></div>
                    <div class="prop-row">
                      <span class="prop-key">Warranty Status</span>
                      <span class="prop-val">
                        <span *ngIf="!asset()?.warrantyExpiryDate" class="text-slate-400 text-xs italic">No info</span>
                        <span *ngIf="asset()?.warrantyExpiryDate && isWarrantyExpired()" class="status-badge status-disposed">Expired</span>
                        <span *ngIf="asset()?.warrantyExpiryDate && !isWarrantyExpired()" class="status-badge status-active">Active · {{ warrantyDaysLeft() }}d left</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div class="col-span-2" *ngIf="asset()?.description">
                  <div class="prop-section">
                    <div class="prop-section-header"><div class="prop-section-dot" style="background:#94a3b8"></div>Description</div>
                    <p class="desc-text">{{ asset()?.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- Activity Log -->
          <mat-tab>
            <ng-template mat-tab-label>
              <span class="tab-label">
                <mat-icon class="tab-icon">history</mat-icon>Activity
                <span class="tab-count">{{ asset()!.history.length }}</span>
              </span>
            </ng-template>
            <div class="tab-body">
              <div class="timeline" *ngIf="asset()!.history.length > 0">
                <div *ngFor="let h of asset()!.history; let last = last" class="tl-item">
                  <div class="tl-left">
                    <div class="tl-dot" [ngClass]="getTimelineIconBg(h.changeType)">
                      <mat-icon class="!text-[13px] !w-[13px] !h-[13px]">{{ getTimelineIcon(h.changeType) }}</mat-icon>
                    </div>
                    <div class="tl-line" *ngIf="!last"></div>
                  </div>
                  <div class="tl-card">
                    <div class="tl-card-header">
                      <span class="tl-event-name">{{ formatChangeType(h.changeType) }}</span>
                      <span class="tl-time">{{ h.timestamp | date:'MMM d, y · h:mm a' }}</span>
                    </div>
                    <p class="tl-detail" *ngIf="h.newValue">{{ h.newValue }}</p>
                    <div class="tl-meta">
                      <mat-icon class="!text-[12px] !w-3 !h-3 text-slate-400">person_outline</mat-icon>
                      <span>{{ h.changedByUserName }}</span>
                      <span *ngIf="h.oldValue" class="tl-old-val">· was: {{ h.oldValue }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div *ngIf="asset()!.history.length === 0" class="empty-state">
                <mat-icon class="empty-icon">history</mat-icon>
                <p class="empty-title">No activity recorded yet</p>
                <p class="empty-sub">Changes to this asset will appear here.</p>
              </div>
            </div>
          </mat-tab>

          <!-- Documents -->
          <mat-tab>
            <ng-template mat-tab-label>
              <span class="tab-label">
                <mat-icon class="tab-icon">attach_file</mat-icon>Documents
                <span class="tab-count">{{ asset()!.documents.length }}</span>
              </span>
            </ng-template>
            <div class="tab-body space-y-5">

              <!-- Upload zone -->
              <div class="upload-zone" *ngIf="isAdminOrManager()">
                <div class="upload-zone-inner">
                  <div class="upload-icon-wrap">
                    <mat-icon class="upload-icon">cloud_upload</mat-icon>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="upload-title">Upload Document</p>
                    <p class="upload-sub">PDF, images, Word, Excel — max 10 MB</p>
                  </div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <mat-form-field appearance="outline" class="doc-type-field">
                      <mat-label>Type</mat-label>
                      <mat-select [formControl]="docTypeControl">
                        <mat-option value="Invoice">Invoice</mat-option>
                        <mat-option value="Warranty">Warranty</mat-option>
                        <mat-option value="Image">Image</mat-option>
                        <mat-option value="Manual">Manual</mat-option>
                        <mat-option value="Certificate">Certificate</mat-option>
                        <mat-option value="Other">Other</mat-option>
                      </mat-select>
                    </mat-form-field>
                    <input type="file" #fileInput (change)="onFileSelected($event)" class="hidden"
                           accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt">
                    <button type="button" class="outline-btn" (click)="fileInput.click()">
                      <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">upload_file</mat-icon>Choose File
                    </button>
                    <span *ngIf="selectedFile" class="selected-file-name">
                      <mat-icon class="!text-[13px] !w-[13px] !h-[13px] text-indigo-500">description</mat-icon>
                      {{ selectedFile.name }}
                    </span>
                    <button type="button" class="primary-btn"
                            (click)="onUpload()"
                            [disabled]="!selectedFile || docTypeControl.invalid || loading()">
                      Upload
                    </button>
                  </div>
                </div>
              </div>

              <!-- Doc list -->
              <div *ngIf="asset()!.documents.length > 0">
                <div class="doc-list-header">
                  <p class="doc-list-title">Documents <span class="doc-count">{{ asset()!.documents.length }}</span></p>
                  <div class="view-toggle">
                    <button [class.active]="viewMode() === 'tree'" (click)="viewMode.set('tree')">
                      <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">folder</mat-icon>Grouped
                    </button>
                    <button [class.active]="viewMode() === 'table'" (click)="viewMode.set('table')">
                      <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">table_rows</mat-icon>Table
                    </button>
                  </div>
                </div>

                <!-- Grouped -->
                <div *ngIf="viewMode() === 'tree'" class="space-y-3">
                  <div *ngFor="let group of documentsGroupedByType()" class="doc-group">
                    <div class="doc-group-header">
                      <div class="doc-group-icon" [ngClass]="getCategoryBadgeClass(group.type)">
                        <mat-icon class="!text-[15px] !w-[15px] !h-[15px]">{{ getCategoryIcon(group.type) }}</mat-icon>
                      </div>
                      <span class="doc-group-name">{{ group.type }}</span>
                      <span class="doc-group-count">{{ group.docs.length }}</span>
                    </div>
                    <div class="doc-rows">
                      <div *ngFor="let doc of group.docs" class="doc-row">
                        <div class="doc-file-icon">
                          <mat-icon class="!text-[17px] !w-[17px] !h-[17px]">{{ getFileIcon(doc.fileName) }}</mat-icon>
                        </div>
                        <div class="doc-info">
                          <p class="doc-name" (click)="onDownload(doc)">{{ doc.fileName }}</p>
                          <p class="doc-meta">{{ formatBytes(doc.fileSizeBytes) }} · {{ doc.uploadedAt | date:'MMM d, y' }} · {{ doc.uploadedByUserName }}</p>
                        </div>
                        <div class="doc-actions">
                          <button class="outline-btn outline-btn--xs" (click)="onDownload(doc)">
                            <mat-icon class="!text-[14px] !w-[14px] !h-[14px]">download</mat-icon>Download
                          </button>
                          <button mat-icon-button (click)="onDeleteDoc(doc)" *ngIf="isAdminOrManager()" matTooltip="Delete" class="delete-btn">
                            <mat-icon class="!text-[17px]">delete_outline</mat-icon>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Table -->
                <table mat-table [dataSource]="asset()!.documents" class="w-full" *ngIf="viewMode() === 'table'">
                  <ng-container matColumnDef="fileName">
                    <th mat-header-cell *matHeaderCellDef>File</th>
                    <td mat-cell *matCellDef="let doc">
                      <div class="flex items-center gap-2">
                        <mat-icon class="!text-[16px] !w-4 !h-4 text-slate-400">{{ getFileIcon(doc.fileName) }}</mat-icon>
                        <span class="text-sm font-medium text-slate-800">{{ doc.fileName }}</span>
                      </div>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="type">
                    <th mat-header-cell *matHeaderCellDef>Type</th>
                    <td mat-cell *matCellDef="let doc">
                      <span class="doc-type-pill" [ngClass]="getCategoryBadgeClass(doc.documentType)">{{ doc.documentType }}</span>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="size">
                    <th mat-header-cell *matHeaderCellDef>Size</th>
                    <td mat-cell *matCellDef="let doc" class="text-slate-500 text-sm">{{ formatBytes(doc.fileSizeBytes) }}</td>
                  </ng-container>
                  <ng-container matColumnDef="uploaded">
                    <th mat-header-cell *matHeaderCellDef>Uploaded</th>
                    <td mat-cell *matCellDef="let doc" class="text-slate-500 text-sm">{{ doc.uploadedAt | date:'MMM d, y' }}</td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef class="text-right">Actions</th>
                    <td mat-cell *matCellDef="let doc" class="text-right whitespace-nowrap">
                      <button mat-icon-button (click)="onDownload(doc)" matTooltip="Download" class="!text-indigo-500"><mat-icon>download</mat-icon></button>
                      <button mat-icon-button (click)="onDeleteDoc(doc)" *ngIf="isAdminOrManager()" matTooltip="Delete" class="delete-btn"><mat-icon>delete_outline</mat-icon></button>
                    </td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="documentColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: documentColumns;"></tr>
                </table>
              </div>

              <div *ngIf="asset()!.documents.length === 0" class="empty-state">
                <mat-icon class="empty-icon">folder_open</mat-icon>
                <p class="empty-title">No documents yet</p>
                <p class="empty-sub">Upload invoices, warranties, manuals, or certificates.</p>
              </div>
            </div>
          </mat-tab>

        </mat-tab-group>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div *ngIf="!asset() && loading()" class="space-y-4 animate-pulse">
      <div class="h-32 bg-slate-200 rounded-2xl"></div>
      <div class="grid grid-cols-4 gap-3">
        <div class="h-24 bg-slate-200 rounded-xl" *ngFor="let i of [1,2,3,4]"></div>
      </div>
      <div class="h-96 bg-slate-200 rounded-xl"></div>
    </div>
  `,
  styles: [`
    /* Hero */
    .hero-header { display:flex; flex-direction:column; gap:0; background:linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e3a5f 100%); border-radius:14px; padding:24px 28px; border:1px solid rgba(99,102,241,.2); box-shadow:0 4px 20px -4px rgb(0 0 0/.2); }
    @media(min-width:640px){ .hero-header{flex-direction:row;align-items:center;justify-content:space-between;} }
    .hero-left { flex:1; min-width:0; }
    .bc-link    { font-size:11.5px;color:#a5b4fc;text-decoration:none;font-weight:500; }
    .bc-link:hover { text-decoration:underline; }
    .bc-sep     { font-size:14px!important;width:14px!important;height:14px!important;color:#4f46e5!important; }
    .bc-current { font-size:11.5px;color:#6366f1;font-weight:500; }
    .hero-title { font-size:22px;font-weight:700;color:#fff;letter-spacing:-0.02em;line-height:1.2; }
    .tag-badge-hero { font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;background:rgba(99,102,241,.25);color:#a5b4fc;border:1px solid rgba(99,102,241,.35);font-family:monospace;letter-spacing:.05em; }
    .hero-meta { display:inline-flex;align-items:center;gap:5px;font-size:12px;color:#94a3b8; }
    .hero-meta-icon { font-size:13px!important;width:13px!important;height:13px!important;color:#6366f1!important; }

    /* Status */
    .status-badge { display:inline-block;font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;letter-spacing:.02em; }
    .status-active   { background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0; }
    .status-repair   { background:#fffbeb;color:#b45309;border:1px solid #fde68a; }
    .status-storage  { background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe; }
    .status-retired  { background:#f8fafc;color:#475569;border:1px solid #e2e8f0; }
    .status-disposed { background:#fff1f2;color:#be123c;border:1px solid #fecdd3; }

    /* Buttons */
    .ghost-btn { display:inline-flex;align-items:center;gap:5px;height:34px;padding:0 14px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.08);font-size:13px;font-weight:500;color:#cbd5e1;cursor:pointer;text-decoration:none;transition:background .15s;white-space:nowrap; }
    .ghost-btn:hover { background:rgba(255,255,255,.14);border-color:rgba(255,255,255,.25); }
    .primary-btn { display:inline-flex;align-items:center;gap:5px;height:34px;padding:0 16px;border-radius:8px;border:none;background:linear-gradient(135deg,#6366f1,#4f46e5);font-size:13px;font-weight:600;color:#fff;cursor:pointer;text-decoration:none;box-shadow:0 2px 8px rgb(99 102 241/.4);transition:opacity .15s;white-space:nowrap; }
    .primary-btn:hover:not([disabled]) { opacity:.88; }
    .primary-btn[disabled] { background:#e2e8f0;color:#94a3b8;box-shadow:none;cursor:not-allowed; }
    .outline-btn { display:inline-flex;align-items:center;gap:5px;height:34px;padding:0 14px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;font-size:13px;font-weight:500;color:#475569;cursor:pointer;transition:border-color .15s;white-space:nowrap; }
    .outline-btn:hover { border-color:#94a3b8;color:#334155; }
    .outline-btn--xs { height:28px!important;padding:0 10px!important;font-size:12px!important; }
    .delete-btn { color:#f43f5e!important; }

    /* KPI */
    .kpi-card { position:relative;background:#fff;border-radius:12px;border:1px solid #e9edf2;padding:16px 18px 20px;display:flex;align-items:center;gap:14px;overflow:hidden;box-shadow:0 1px 3px rgb(0 0 0/.05);transition:box-shadow .2s,transform .2s; }
    .kpi-card:hover { box-shadow:0 6px 20px -4px rgb(0 0 0/.1);transform:translateY(-1px); }
    .kpi-icon-wrap { width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .kpi-label    { font-size:11.5px;color:#64748b;font-weight:500;margin:0; }
    .kpi-value    { font-size:20px;font-weight:700;color:#0f172a;margin:3px 0 0;line-height:1.1;font-family:'Outfit',sans-serif; }
    .kpi-value--sm { font-size:14px; }
    .kpi-unit     { font-size:12px;font-weight:400;color:#94a3b8;margin-left:4px; }
    .kpi-sub      { font-size:10.5px;font-weight:600;margin:2px 0 0; }
    .kpi-bar      { position:absolute;bottom:0;left:0;right:0;height:3px; }

    /* Tab card */
    .tab-card { position:relative;background:#fff;border-radius:12px;border:1px solid #e9edf2;overflow:hidden;box-shadow:0 1px 3px rgb(0 0 0/.05); }
    .tab-label { display:flex;align-items:center;gap:6px; }
    .tab-icon  { font-size:16px!important;width:16px!important;height:16px!important; }
    .tab-count { font-size:10px;font-weight:700;padding:1px 6px;border-radius:10px;background:#f1f5f9;color:#64748b; }
    .tab-body  { padding:24px 28px; }

    /* Two-col */
    .two-col-layout { display:grid;grid-template-columns:1fr 1fr;gap:20px; }
    @media(max-width:767px){ .two-col-layout{grid-template-columns:1fr;} .col-span-2{grid-column:span 1;} }
    .col-span-2 { grid-column:span 2; }

    /* Prop section */
    .prop-section { background:#fafafa;border:1px solid #f1f5f9;border-radius:10px;overflow:hidden; }
    .prop-section-header { display:flex;align-items:center;gap:8px;padding:11px 16px;background:#f8fafc;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:700;color:#334155;text-transform:uppercase;letter-spacing:.06em; }
    .prop-section-dot { width:8px;height:8px;border-radius:50%;flex-shrink:0; }
    .prop-list { padding:4px 0; }
    .prop-row { display:flex;align-items:center;justify-content:space-between;padding:9px 16px;border-bottom:1px solid #f1f5f9;gap:12px; }
    .prop-row:last-child { border-bottom:none; }
    .prop-key { font-size:12.5px;color:#64748b;font-weight:500;flex-shrink:0; }
    .prop-val { font-size:13px;color:#0f172a;font-weight:500;text-align:right; }
    .tag-mono { font-size:11px;font-weight:700;padding:2px 7px;border-radius:5px;background:#eef2ff;color:#4f46e5;font-family:monospace;letter-spacing:.05em; }
    .desc-text { padding:14px 16px;font-size:13.5px;color:#475569;line-height:1.7;margin:0; }

    /* Timeline */
    .timeline { display:flex;flex-direction:column;gap:0; }
    .tl-item  { display:flex;gap:14px; }
    .tl-left  { display:flex;flex-direction:column;align-items:center;flex-shrink:0; }
    .tl-dot   { width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;box-shadow:0 0 0 4px #fff,0 0 0 5px #e9edf2; }
    .tl-line  { width:2px;flex:1;background:#f1f5f9;margin:6px 0;min-height:20px; }
    .tl-card  { flex:1;background:#fafafa;border:1px solid #f1f5f9;border-radius:10px;padding:12px 16px;margin-bottom:12px; }
    .tl-card-header { display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:4px; }
    .tl-event-name { font-size:13px;font-weight:700;color:#1e293b; }
    .tl-time       { font-size:11.5px;color:#94a3b8; }
    .tl-detail     { font-size:13px;color:#475569;margin:4px 0 6px; }
    .tl-meta       { display:flex;align-items:center;gap:4px;font-size:11.5px;color:#94a3b8; }
    .tl-old-val    { color:#cbd5e1; }
    .tl-created { background:#22c55e; } .tl-updated { background:#6366f1; }
    .tl-status  { background:#f59e0b; } .tl-docadd  { background:#8b5cf6; }
    .tl-docrem  { background:#f43f5e; } .tl-default { background:#94a3b8; }

    /* Upload zone */
    .upload-zone { border-radius:12px;border:1.5px dashed #c7d2fe;background:#fafaff;padding:18px 20px; }
    .upload-zone-inner { display:flex;align-items:center;gap:16px;flex-wrap:wrap; }
    .upload-icon-wrap { width:44px;height:44px;border-radius:12px;background:#eef2ff;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .upload-icon { color:#6366f1!important;font-size:22px!important;width:22px!important;height:22px!important; }
    .upload-title { font-size:13.5px;font-weight:600;color:#1e293b;margin:0; }
    .upload-sub   { font-size:11.5px;color:#94a3b8;margin:2px 0 0; }
    .doc-type-field { width:140px!important; }
    .upload-zone .outline-btn { border-color:#e2e8f0;background:#fff;color:#475569; }
    .upload-zone .outline-btn:hover { border-color:#94a3b8; }
    .selected-file-name { display:inline-flex;align-items:center;gap:5px;font-size:12.5px;font-weight:500;color:#475569;background:#eef2ff;border-radius:6px;padding:4px 10px;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }

    /* Doc list */
    .doc-list-header { display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px; }
    .doc-list-title  { font-size:13.5px;font-weight:600;color:#0f172a;margin:0; }
    .doc-count { display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;min-width:20px;height:20px;border-radius:10px;background:#eef2ff;color:#4f46e5;padding:0 6px;margin-left:6px; }
    .view-toggle { display:inline-flex;background:#f1f5f9;border-radius:8px;padding:3px;gap:2px; }
    .view-toggle button { display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:6px;border:none;font-size:12px;font-weight:500;color:#64748b;background:transparent;cursor:pointer;transition:background .15s,color .15s; }
    .view-toggle button.active { background:#fff;color:#0f172a;box-shadow:0 1px 3px rgb(0 0 0/.08); }

    /* Doc group */
    .doc-group { border:1px solid #e9edf2;border-radius:10px;overflow:hidden; }
    .doc-group-header { display:flex;align-items:center;gap:10px;padding:10px 16px;background:#f8fafc;border-bottom:1px solid #f1f5f9; }
    .doc-group-icon { width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
    .doc-group-name { font-size:13px;font-weight:600;color:#334155; }
    .doc-group-count { margin-left:auto;font-size:11px;font-weight:700;padding:1px 7px;border-radius:10px;background:#e9edf2;color:#64748b; }
    .doc-rows { background:#fff; }
    .doc-row { display:flex;align-items:center;gap:12px;padding:11px 16px;border-bottom:1px solid #f8fafc;transition:background .12s; }
    .doc-row:last-child { border-bottom:none; }
    .doc-row:hover { background:#fafafa; }
    .doc-file-icon { width:34px;height:34px;border-radius:8px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#64748b; }
    .doc-info { flex:1;min-width:0; }
    .doc-name { font-size:13px;font-weight:600;color:#1e293b;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transition:color .15s;margin:0; }
    .doc-name:hover { color:#6366f1; }
    .doc-meta { font-size:11.5px;color:#94a3b8;margin-top:2px; }
    .doc-actions { display:flex;align-items:center;gap:4px;flex-shrink:0; }
    .doc-type-pill { font-size:11px;font-weight:700;padding:2px 8px;border-radius:20px; }
    .badge-invoice     { background:#eff6ff;color:#1d4ed8; }
    .badge-warranty    { background:#f0fdf4;color:#15803d; }
    .badge-image       { background:#f5f3ff;color:#7c3aed; }
    .badge-manual      { background:#fffbeb;color:#b45309; }
    .badge-certificate { background:#fff1f2;color:#be123c; }
    .badge-other       { background:#f8fafc;color:#475569; }

    /* Empty */
    .empty-state { text-align:center;padding:52px 24px; }
    .empty-icon  { font-size:46px!important;width:46px!important;height:46px!important;color:#cbd5e1!important; }
    .empty-title { font-size:14px;font-weight:600;color:#475569;margin:12px 0 4px; }
    .empty-sub   { font-size:12.5px;color:#94a3b8; }
  `]
})
export class AssetDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly assetService = inject(AssetService);
  private readonly documentService = inject(DocumentService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly asset   = signal<AssetDetailDto | null>(null);
  readonly loading = signal(false);
  readonly viewMode = signal<'tree' | 'table'>('tree');

  readonly docTypeControl = new FormControl('Other', [Validators.required]);
  selectedFile: File | null = null;

  readonly documentColumns = ['fileName', 'type', 'size', 'uploaded', 'actions'];

  readonly documentsGroupedByType = computed(() => {
    const docs = this.asset()?.documents ?? [];
    const typeOrder = ['Invoice', 'Warranty', 'Image', 'Manual', 'Certificate', 'Other'];
    const grouped = new Map<string, AssetDocumentDto[]>();
    for (const doc of docs) {
      const type = doc.documentType || 'Other';
      if (!grouped.has(type)) grouped.set(type, []);
      grouped.get(type)!.push(doc);
    }
    return typeOrder.filter(t => grouped.has(t)).map(t => ({ type: t, docs: grouped.get(t)! }));
  });

  warrantyDaysLeft(): number {
    const expiry = this.asset()?.warrantyExpiryDate;
    if (!expiry) return 0;
    return Math.max(0, Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000));
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) this.loadAsset(id);
  }

  private loadAsset(id: string): void {
    this.loading.set(true);
    this.assetService.getAssetById(id).subscribe({
      next: (res) => { this.asset.set(res); this.loading.set(false); },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error loading asset details.', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
        this.router.navigate(['/assets']);
      }
    });
  }

  isAdminOrManager(): boolean {
    const role = this.authService.currentUser()?.role;
    return role === 'Administrator' || role === 'Manager';
  }

  isWarrantyExpired(): boolean {
    const expiry = this.asset()?.warrantyExpiryDate;
    return !!expiry && new Date(expiry).getTime() < Date.now();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) this.selectedFile = file;
  }

  onUpload(): void {
    const assetId = this.asset()?.id;
    if (!assetId || !this.selectedFile || this.docTypeControl.invalid) return;
    if (this.selectedFile.size > 10 * 1024 * 1024) {
      this.snackBar.open('File exceeds 10 MB limit.', 'Close', { duration: 4000 });
      return;
    }
    this.loading.set(true);
    this.documentService.uploadDocument(assetId, this.selectedFile, this.docTypeControl.value!).subscribe({
      next: () => {
        this.loading.set(false);
        this.selectedFile = null;
        this.snackBar.open('Document uploaded.', 'Close', { duration: 3000 });
        this.loadAsset(assetId);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.error?.message || 'Upload failed.', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
      }
    });
  }

  onDownload(doc: AssetDocumentDto): void {
    this.loading.set(true);
    this.documentService.downloadDocument(doc.id).subscribe({
      next: (blob) => {
        this.loading.set(false);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = doc.fileName;
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => { this.loading.set(false); this.snackBar.open('Download failed.', 'Close', { duration: 4000 }); }
    });
  }

  onDeleteDoc(doc: AssetDocumentDto): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete Document', message: `Permanently delete "${doc.fileName}"? This cannot be undone.`, confirmText: 'Delete' }
    });
    ref.afterClosed().subscribe(confirmed => {
      if (!confirmed) return;
      this.loading.set(true);
      this.documentService.deleteDocument(doc.id).subscribe({
        next: () => {
          this.loading.set(false);
          this.snackBar.open('Document deleted.', 'Close', { duration: 3000 });
          this.loadAsset(this.asset()!.id);
        },
        error: () => {
          this.loading.set(false);
          this.snackBar.open('Delete failed.', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
        }
      });
    });
  }

  // ── UI helpers ──

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active':    return 'status-active';
      case 'InRepair':  return 'status-repair';
      case 'InStorage': return 'status-storage';
      case 'Retired':   return 'status-retired';
      case 'Disposed':  return 'status-disposed';
      default:          return 'status-retired';
    }
  }

  formatStatus(s: string): string {
    if (s === 'InRepair')  return 'In Repair';
    if (s === 'InStorage') return 'In Storage';
    return s;
  }

  formatChangeType(t: string): string {
    if (t === 'StatusChanged')   return 'Status Changed';
    if (t === 'DocumentAdded')   return 'Document Added';
    if (t === 'DocumentRemoved') return 'Document Removed';
    return t;
  }

  formatBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  getCategoryIcon(type: string): string {
    const map: Record<string, string> = { Invoice: 'receipt_long', Warranty: 'verified_user', Image: 'image', Manual: 'menu_book', Certificate: 'workspace_premium' };
    return map[type] ?? 'attach_file';
  }

  getCategoryBadgeClass(type: string): string {
    const map: Record<string, string> = { Invoice: 'badge-invoice', Warranty: 'badge-warranty', Image: 'badge-image', Manual: 'badge-manual', Certificate: 'badge-certificate', Other: 'badge-other' };
    return map[type] ?? 'badge-other';
  }

  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    if (['jpg','jpeg','png','gif','webp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'picture_as_pdf';
    if (['doc','docx'].includes(ext)) return 'article';
    if (['xls','xlsx'].includes(ext)) return 'table_chart';
    return 'insert_drive_file';
  }

  getTimelineIcon(changeType: string): string {
    const map: Record<string, string> = { Created: 'add', Updated: 'edit', StatusChanged: 'swap_horiz', Assigned: 'swap_horiz', DocumentAdded: 'upload_file', DocumentRemoved: 'delete' };
    return map[changeType] ?? 'history';
  }

  getTimelineIconBg(changeType: string): string {
    const map: Record<string, string> = { Created: 'tl-created', Updated: 'tl-updated', StatusChanged: 'tl-status', Assigned: 'tl-status', DocumentAdded: 'tl-docadd', DocumentRemoved: 'tl-docrem' };
    return map[changeType] ?? 'tl-default';
  }
}
