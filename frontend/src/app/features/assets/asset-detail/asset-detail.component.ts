import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
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
    MatCardModule,
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
    <div class="space-y-6 animate-fade-in" *ngIf="asset()">
      
      <!-- Detail Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div class="space-y-1">
          <div class="flex items-center space-x-2">
            <span class="text-xs font-bold font-sans uppercase tracking-widest px-2.5 py-0.5 bg-cyan-50 text-cyan-700 rounded-md border border-cyan-200">
              {{ asset()?.assetTag }}
            </span>
            <span class="px-2 py-0.5 text-xs font-bold rounded-full" [ngClass]="getStatusClass(asset()!.status)">
              {{ formatStatus(asset()!.status) }}
            </span>
          </div>
          <h1 class="text-2xl font-extrabold text-slate-800 font-sans tracking-tight">{{ asset()?.name }}</h1>
          <p class="text-sm text-slate-500 font-sans">
            <mat-icon class="!w-4 !h-4 !text-[14px] align-middle mr-1 text-slate-400">business</mat-icon>
            Belongs to: <span class="font-semibold text-slate-700">{{ asset()?.organizationUnitName }}</span>
            <span class="mx-2 text-slate-300">|</span>
            <mat-icon class="!w-4 !h-4 !text-[14px] align-middle mr-1 text-slate-400">category</mat-icon>
            Category: <span class="font-semibold text-slate-700">{{ asset()?.categoryName }}</span>
          </p>
        </div>
        <div class="flex space-x-3">
          <button mat-stroked-button type="button" routerLink="/assets" class="!text-slate-600 !rounded-xl !border-slate-300">
            <mat-icon class="mr-1">arrow_back</mat-icon> Back to Assets
          </button>
          <a mat-raised-button color="accent" [routerLink]="['/assets/edit', asset()?.id]" *ngIf="isAdminOrManager()" class="!rounded-xl shadow-sm">
            <mat-icon class="mr-1">edit</mat-icon> Edit Asset
          </a>
        </div>
      </div>

      <!-- Quick Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p class="text-xs text-slate-500 font-sans font-medium mb-1">Purchase Cost</p>
          <p class="text-lg font-extrabold text-slate-800">{{ asset()?.purchaseCost ? (asset()?.purchaseCost | currency) : 'N/A' }}</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p class="text-xs text-slate-500 font-sans font-medium mb-1">Purchase Date</p>
          <p class="text-lg font-extrabold text-slate-800">{{ (asset()?.purchaseDate | date:'mediumDate') || 'N/A' }}</p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p class="text-xs text-slate-500 font-sans font-medium mb-1">Warranty Expiry</p>
          <p class="text-lg font-extrabold" [ngClass]="isWarrantyExpired() ? 'text-rose-600' : 'text-slate-800'">
            {{ (asset()?.warrantyExpiryDate | date:'mediumDate') || 'N/A' }}
            <span *ngIf="isWarrantyExpired()" class="block text-xs font-semibold text-rose-500 mt-0.5">⚠ Expired</span>
            <span *ngIf="!isWarrantyExpired() && asset()?.warrantyExpiryDate && warrantyDaysLeft() > 0" class="block text-xs font-medium text-emerald-600 mt-0.5">{{ warrantyDaysLeft() }} days remaining</span>
          </p>
        </div>
        <div class="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p class="text-xs text-slate-500 font-sans font-medium mb-1">Documents</p>
          <p class="text-lg font-extrabold text-slate-800">{{ asset()?.documents?.length || 0 }} <span class="text-sm font-normal text-slate-400">files</span></p>
        </div>
      </div>

      <!-- Main Content Tabs -->
      <mat-card class="!p-0 overflow-hidden">
        <mat-progress-bar *ngIf="loading()" mode="query" class="absolute top-0 left-0 right-0 z-10"></mat-progress-bar>
        
        <mat-tab-group dynamicHeight class="custom-tabs">
          
          <!-- Details Tab -->
          <mat-tab label="Overview">
            <div class="p-6 md:p-8 space-y-8">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                <!-- Info Section -->
                <div class="space-y-4">
                  <h3 class="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center">
                    <mat-icon class="mr-2 text-cyan-500 !w-5 !h-5 !text-[20px]">info</mat-icon> Asset Details
                  </h3>
                  <div class="grid grid-cols-2 gap-y-3 text-sm font-sans">
                    <span class="text-slate-500">Asset Tag</span>
                    <span class="font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded w-fit">{{ asset()?.assetTag }}</span>
                    
                    <span class="text-slate-500">Classification</span>
                    <span class="font-medium text-slate-800">{{ asset()?.categoryName }}</span>
                    
                    <span class="text-slate-500">Serial Number (S/N)</span>
                    <span class="font-medium text-slate-800 font-mono text-xs">{{ asset()?.serialNumber || 'N/A' }}</span>
                    
                    <span class="text-slate-500">Current Status</span>
                    <span class="px-2 py-0.5 text-xs font-bold rounded-full w-fit" [ngClass]="getStatusClass(asset()!.status)">{{ formatStatus(asset()!.status) }}</span>
                    
                    <span class="text-slate-500">Organization Unit</span>
                    <span class="font-medium text-slate-800">{{ asset()?.organizationUnitName }}</span>
                    
                    <span class="text-slate-500">Registered On</span>
                    <span class="font-medium text-slate-800">{{ asset()?.createdAt | date:'medium' }}</span>
                    
                    <span class="text-slate-500">Last Updated</span>
                    <span class="font-medium text-slate-800">{{ (asset()?.updatedAt | date:'medium') || 'Never modified' }}</span>
                  </div>
                </div>

                <!-- Financial Section -->
                <div class="space-y-4">
                  <h3 class="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center">
                    <mat-icon class="mr-2 text-emerald-500 !w-5 !h-5 !text-[20px]">payments</mat-icon> Procurement & Warranty
                  </h3>
                  <div class="grid grid-cols-2 gap-y-3 text-sm font-sans">
                    <span class="text-slate-500">Purchase Date</span>
                    <span class="font-medium text-slate-800">{{ (asset()?.purchaseDate | date:'mediumDate') || 'N/A' }}</span>
                    
                    <span class="text-slate-500">Purchase Cost</span>
                    <span class="font-bold text-slate-800 text-base">{{ asset()?.purchaseCost ? (asset()?.purchaseCost | currency) : 'N/A' }}</span>
                    
                    <span class="text-slate-500">Warranty Expiry</span>
                    <span class="font-medium text-slate-800" [ngClass]="{'text-rose-600': isWarrantyExpired()}">
                      {{ (asset()?.warrantyExpiryDate | date:'mediumDate') || 'N/A' }}
                      <span *ngIf="isWarrantyExpired()" class="text-xs font-bold ml-1">(Expired)</span>
                    </span>
                    
                    <span class="text-slate-500">Warranty Status</span>
                    <span *ngIf="!asset()?.warrantyExpiryDate" class="text-slate-400 italic">No warranty info</span>
                    <span *ngIf="asset()?.warrantyExpiryDate && isWarrantyExpired()" class="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-700 w-fit">Expired</span>
                    <span *ngIf="asset()?.warrantyExpiryDate && !isWarrantyExpired()" class="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 w-fit">Active — {{ warrantyDaysLeft() }} days left</span>
                  </div>
                </div>

                <!-- Description -->
                <div class="md:col-span-2 space-y-2" *ngIf="asset()?.description">
                  <h3 class="text-lg font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center">
                    <mat-icon class="mr-2 text-slate-400 !w-5 !h-5 !text-[20px]">description</mat-icon> Description
                  </h3>
                  <p class="text-slate-600 leading-relaxed font-sans bg-slate-50 p-4 rounded-xl border border-slate-100">{{ asset()?.description }}</p>
                </div>
              </div>
            </div>
          </mat-tab>

          <!-- History Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <span class="flex items-center space-x-1.5">
                <mat-icon class="!w-5 !h-5 !text-[18px]">history</mat-icon>
                <span>Activity Log</span>
                <span class="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-200 text-slate-600">{{ asset()!.history.length }}</span>
              </span>
            </ng-template>
            <div class="p-6 md:p-8">
              <!-- Timeline view -->
              <div class="space-y-4" *ngIf="asset()!.history.length > 0">
                <div *ngFor="let h of asset()!.history; let i = index" class="flex items-start space-x-4 group">
                  <div class="flex flex-col items-center">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center text-white shadow-sm" [ngClass]="getTimelineIconBg(h.changeType)">
                      <mat-icon class="!w-5 !h-5 !text-[18px]">{{ getTimelineIcon(h.changeType) }}</mat-icon>
                    </div>
                    <div class="w-0.5 h-full bg-slate-200 mt-1" *ngIf="i < asset()!.history.length - 1"></div>
                  </div>
                  <div class="flex-1 pb-6">
                    <div class="flex items-center space-x-2 mb-1">
                      <span class="font-bold text-sm text-slate-800 font-sans">{{ formatChangeType(h.changeType) }}</span>
                      <span class="text-xs text-slate-400">•</span>
                      <span class="text-xs text-slate-500 font-sans">{{ h.timestamp | date:'medium' }}</span>
                    </div>
                    <p class="text-sm text-slate-600 font-sans">{{ h.newValue || 'No details recorded' }}</p>
                    <p class="text-xs text-slate-400 font-sans mt-1" *ngIf="h.oldValue">Previous: {{ h.oldValue }}</p>
                    <p class="text-xs text-slate-500 font-sans mt-1">
                      <mat-icon class="!w-3 !h-3 !text-[12px] align-middle mr-0.5">person</mat-icon> {{ h.changedByUserName }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Empty History -->
              <div *ngIf="asset()!.history.length === 0" class="text-center py-12">
                <mat-icon class="!text-slate-300 !w-12 !h-12 !text-[48px] mb-2">history</mat-icon>
                <p class="text-slate-500 font-sans">No activity log recorded</p>
              </div>
            </div>
          </mat-tab>

          <!-- Documents Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <span class="flex items-center space-x-1.5">
                <mat-icon class="!w-5 !h-5 !text-[18px]">attach_file</mat-icon>
                <span>Documents</span>
                <span class="ml-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-200 text-slate-600">{{ asset()!.documents.length }}</span>
              </span>
            </ng-template>
            <div class="p-6 md:p-8 space-y-6">
              
              <!-- Upload Section (Managers/Admins only) -->
              <div class="bg-slate-50 p-6 rounded-2xl border border-slate-200/80 space-y-4" *ngIf="isAdminOrManager()">
                <div class="flex items-center justify-between">
                  <h3 class="text-base font-bold text-slate-800 font-sans flex items-center">
                    <mat-icon class="mr-2 text-rose-500">cloud_upload</mat-icon> Upload Supporting Document
                  </h3>
                  <span class="text-xs text-slate-500 font-medium">Max size: 10 MB</span>
                </div>
                
                <div class="flex flex-col md:flex-row items-start md:items-center gap-4">
                  <mat-form-field appearance="outline" class="w-full md:w-56 !mb-0">
                    <mat-label>Document Type</mat-label>
                    <mat-select [formControl]="docTypeControl">
                      <mat-option value="Invoice">📄 Invoice</mat-option>
                      <mat-option value="Warranty">🛡️ Warranty</mat-option>
                      <mat-option value="Image">🖼️ Image</mat-option>
                      <mat-option value="Manual">📘 Manual</mat-option>
                      <mat-option value="Certificate">📜 Certificate</mat-option>
                      <mat-option value="Other">📎 Other</mat-option>
                    </mat-select>
                  </mat-form-field>

                  <div class="flex items-center space-x-3 w-full md:w-auto">
                    <input type="file" #fileInput (change)="onFileSelected($event)" class="hidden" accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.txt">
                    <button mat-raised-button color="primary" (click)="fileInput.click()" class="!rounded-xl !py-5">
                      <mat-icon class="mr-1">upload_file</mat-icon> Select File
                    </button>
                    <span class="text-sm font-semibold text-slate-700 font-sans max-w-[200px] truncate" *ngIf="selectedFile">
                      {{ selectedFile.name }} <span class="text-xs text-slate-400">({{ formatBytes(selectedFile.size) }})</span>
                    </span>
                  </div>

                  <button mat-raised-button color="accent" (click)="onUpload()" [disabled]="!selectedFile || docTypeControl.invalid || loading()" class="!rounded-xl !py-5 w-full md:w-auto shadow-md">
                    Upload Document
                  </button>
                </div>
              </div>

              <!-- View Switcher -->
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100" *ngIf="asset()!.documents.length > 0">
                <div>
                  <h3 class="text-lg font-extrabold text-slate-800 font-sans tracking-tight">Associated Documents</h3>
                  <p class="text-xs text-slate-500">{{ asset()!.documents.length }} file(s) organized by document type</p>
                </div>
                <div class="inline-flex p-1 bg-slate-100 rounded-xl space-x-1">
                  <button type="button" (click)="viewMode.set('tree')" [ngClass]="viewMode() === 'tree' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1">
                    <mat-icon class="!w-4 !h-4 !text-[16px]">folder</mat-icon>
                    <span>Categorized</span>
                  </button>
                  <button type="button" (click)="viewMode.set('table')" [ngClass]="viewMode() === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'" class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1">
                    <mat-icon class="!w-4 !h-4 !text-[16px]">table_rows</mat-icon>
                    <span>Table</span>
                  </button>
                </div>
              </div>

              <!-- CATEGORIZED TREE VIEW -->
              <div *ngIf="viewMode() === 'tree' && asset()!.documents.length > 0" class="space-y-4">
                <div *ngFor="let group of documentsGroupedByType()" class="border border-slate-200/70 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div class="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div class="flex items-center space-x-2.5">
                      <mat-icon class="!text-slate-500">{{ getCategoryIcon(group.type) }}</mat-icon>
                      <span class="font-bold text-sm text-slate-800 font-sans">{{ group.type }}</span>
                      <span class="px-2 py-0.5 text-[11px] font-bold rounded-full" [ngClass]="getCategoryBadgeClass(group.type)">
                        {{ group.docs.length }} {{ group.docs.length === 1 ? 'file' : 'files' }}
                      </span>
                    </div>
                  </div>
                  <div class="divide-y divide-slate-100">
                    <div *ngFor="let doc of group.docs" class="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors">
                      <div class="flex items-start space-x-3">
                        <div class="p-2 rounded-lg bg-slate-100 text-slate-600">
                          <mat-icon class="!w-5 !h-5 !text-[20px]">{{ getFileIcon(doc.fileName) }}</mat-icon>
                        </div>
                        <div>
                          <p class="font-bold text-sm text-slate-900 font-sans hover:text-cyan-600 cursor-pointer" (click)="onDownload(doc)" title="Click to download">
                            {{ doc.fileName }}
                          </p>
                          <p class="text-xs text-slate-500 space-x-2 mt-0.5">
                            <span>{{ formatBytes(doc.fileSizeBytes) }}</span>
                            <span>•</span>
                            <span>{{ doc.uploadedAt | date:'mediumDate' }}</span>
                            <span>•</span>
                            <span>by {{ doc.uploadedByUserName }}</span>
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center space-x-2 self-end sm:self-auto">
                        <button mat-stroked-button color="primary" (click)="onDownload(doc)" class="!rounded-lg !text-xs !py-1">
                          <mat-icon class="!w-4 !h-4 !text-[16px] mr-1">download</mat-icon> Download
                        </button>
                        <button mat-icon-button color="warn" (click)="onDeleteDoc(doc)" *ngIf="isAdminOrManager()" matTooltip="Delete this document">
                          <mat-icon>delete</mat-icon>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- FLAT TABLE VIEW -->
              <table mat-table [dataSource]="asset()!.documents" class="w-full" *ngIf="viewMode() === 'table' && asset()!.documents.length > 0">
                <ng-container matColumnDef="fileName">
                  <th mat-header-cell *matHeaderCellDef class="!font-bold !text-slate-700">File Name</th>
                  <td mat-cell *matCellDef="let doc" class="font-semibold text-slate-800 max-w-[200px] truncate" [title]="doc.fileName">{{ doc.fileName }}</td>
                </ng-container>
                <ng-container matColumnDef="type">
                  <th mat-header-cell *matHeaderCellDef class="!font-bold !text-slate-700">Type</th>
                  <td mat-cell *matCellDef="let doc" class="text-slate-600 font-sans">
                    <span class="px-2 py-0.5 text-xs font-bold rounded" [ngClass]="getCategoryBadgeClass(doc.documentType)">{{ doc.documentType }}</span>
                  </td>
                </ng-container>
                <ng-container matColumnDef="size">
                  <th mat-header-cell *matHeaderCellDef class="!font-bold !text-slate-700">Size</th>
                  <td mat-cell *matCellDef="let doc" class="text-slate-500 font-sans">{{ formatBytes(doc.fileSizeBytes) }}</td>
                </ng-container>
                <ng-container matColumnDef="uploaded">
                  <th mat-header-cell *matHeaderCellDef class="!font-bold !text-slate-700">Uploaded</th>
                  <td mat-cell *matCellDef="let doc" class="text-slate-500 font-sans">{{ doc.uploadedAt | date:'mediumDate' }}</td>
                </ng-container>
                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef class="!font-bold !text-slate-700 text-right">Actions</th>
                  <td mat-cell *matCellDef="let doc" class="text-right whitespace-nowrap">
                    <button mat-icon-button color="primary" (click)="onDownload(doc)" matTooltip="Download">
                      <mat-icon>download</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" (click)="onDeleteDoc(doc)" *ngIf="isAdminOrManager()" matTooltip="Delete">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </ng-container>
                <tr mat-header-row *matHeaderRowDef="documentColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: documentColumns;" class="hover:bg-slate-50 transition-colors"></tr>
              </table>

              <!-- Empty Attachments -->
              <div *ngIf="asset()!.documents.length === 0" class="text-center py-16">
                <mat-icon class="!text-slate-300 !w-16 !h-16 !text-[64px] mb-3">folder_open</mat-icon>
                <p class="text-slate-500 font-bold font-sans text-base mb-1">No documents yet</p>
                <p class="text-slate-400 text-sm font-sans">Upload invoices, warranties, manuals, and certificates for this asset.</p>
              </div>

            </div>
          </mat-tab>

        </mat-tab-group>
      </mat-card>
    </div>

    <!-- Loading skeleton -->
    <div *ngIf="!asset() && loading()" class="space-y-4 animate-pulse">
      <div class="bg-slate-200 h-24 rounded-2xl"></div>
      <div class="grid grid-cols-4 gap-4">
        <div class="bg-slate-200 h-20 rounded-xl" *ngFor="let i of [1,2,3,4]"></div>
      </div>
      <div class="bg-slate-200 h-96 rounded-2xl"></div>
    </div>
  `,
  styles: [`
    ::ng-deep .custom-tabs .mat-mdc-tab-header {
      border-bottom: 1px solid #f1f5f9;
      background: #fafafb;
    }
    ::ng-deep .custom-tabs .mat-mdc-tab {
      min-width: 140px;
    }
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

  readonly asset = signal<AssetDetailDto | null>(null);
  readonly loading = signal(false);
  readonly viewMode = signal<'tree' | 'table'>('tree');

  // Document upload form controls
  readonly docTypeControl = new FormControl('Other', [Validators.required]);
  selectedFile: File | null = null;

  readonly historyColumns = ['timestamp', 'changeType', 'oldValue', 'newValue', 'user'];
  readonly documentColumns = ['fileName', 'type', 'size', 'uploaded', 'actions'];

  /** Group documents by their DocumentType for the categorized tree view */
  readonly documentsGroupedByType = computed(() => {
    const docs = this.asset()?.documents ?? [];
    const typeOrder = ['Invoice', 'Warranty', 'Image', 'Manual', 'Certificate', 'Other'];
    const grouped = new Map<string, AssetDocumentDto[]>();
    for (const doc of docs) {
      const type = doc.documentType || 'Other';
      if (!grouped.has(type)) grouped.set(type, []);
      grouped.get(type)!.push(doc);
    }
    return typeOrder
      .filter(t => grouped.has(t))
      .map(t => ({ type: t, docs: grouped.get(t)! }));
  });

  /** Days remaining on warranty */
  warrantyDaysLeft(): number {
    const expiry = this.asset()?.warrantyExpiryDate;
    if (!expiry) return 0;
    const diff = new Date(expiry).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadAsset(id);
    }
  }

  private loadAsset(id: string): void {
    this.loading.set(true);
    this.assetService.getAssetById(id).subscribe({
      next: (res) => {
        this.asset.set(res);
        this.loading.set(false);
      },
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
    if (!expiry) return false;
    return new Date(expiry).getTime() < Date.now();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  onUpload(): void {
    const assetId = this.asset()?.id;
    if (!assetId || !this.selectedFile || this.docTypeControl.invalid) return;

    const maxSizeBytes = 10 * 1024 * 1024;
    if (this.selectedFile.size > maxSizeBytes) {
      this.snackBar.open('File exceeds maximum size of 10 MB.', 'Close', { duration: 4000 });
      return;
    }

    this.loading.set(true);
    this.documentService.uploadDocument(assetId, this.selectedFile, this.docTypeControl.value!).subscribe({
      next: () => {
        this.loading.set(false);
        this.selectedFile = null;
        this.snackBar.open('Document uploaded successfully.', 'Close', { duration: 3000 });
        this.loadAsset(assetId);
      },
      error: (err) => {
        this.loading.set(false);
        this.snackBar.open(err.error?.message || 'Error uploading document.', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
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
        a.href = url;
        a.download = doc.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error downloading document.', 'Close', { duration: 4000 });
      }
    });
  }

  onDeleteDoc(doc: AssetDocumentDto): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Delete Document',
        message: `Are you sure you want to permanently delete "${doc.fileName}"? This action cannot be undone.`,
        confirmText: 'Delete'
      }
    });

    dialogRef.afterClosed().subscribe(confirm => {
      if (confirm) {
        this.loading.set(true);
        this.documentService.deleteDocument(doc.id).subscribe({
          next: () => {
            this.loading.set(false);
            this.snackBar.open('Document deleted successfully.', 'Close', { duration: 3000 });
            this.loadAsset(this.asset()!.id);
          },
          error: () => {
            this.loading.set(false);
            this.snackBar.open('Error deleting document.', 'Close', { duration: 4000, panelClass: ['error-snackbar'] });
          }
        });
      }
    });
  }

  // --- UI Helper Methods ---

  getStatusClass(status: string): string {
    switch (status) {
      case 'Active': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'InRepair': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'InStorage': return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'Retired': return 'bg-slate-100 text-slate-800 border border-slate-200';
      case 'Disposed': return 'bg-rose-100 text-rose-800 border border-rose-200';
      default: return 'bg-slate-100 text-slate-800';
    }
  }

  formatStatus(status: string): string {
    if (status === 'InRepair') return 'In Repair';
    if (status === 'InStorage') return 'In Storage';
    return status;
  }

  formatChangeType(type: string): string {
    if (type === 'StatusChanged') return 'Status Changed';
    if (type === 'DocumentAdded') return 'Document Added';
    if (type === 'DocumentRemoved') return 'Document Removed';
    return type;
  }

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getCategoryIcon(type: string): string {
    switch (type) {
      case 'Invoice': return 'receipt_long';
      case 'Warranty': return 'verified_user';
      case 'Image': return 'image';
      case 'Manual': return 'menu_book';
      case 'Certificate': return 'workspace_premium';
      default: return 'attach_file';
    }
  }

  getCategoryBadgeClass(type: string): string {
    switch (type) {
      case 'Invoice': return 'bg-blue-100 text-blue-700';
      case 'Warranty': return 'bg-emerald-100 text-emerald-700';
      case 'Image': return 'bg-violet-100 text-violet-700';
      case 'Manual': return 'bg-amber-100 text-amber-700';
      case 'Certificate': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  getFileIcon(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'picture_as_pdf';
    if (['doc', 'docx'].includes(ext)) return 'article';
    if (['xls', 'xlsx'].includes(ext)) return 'table_chart';
    return 'insert_drive_file';
  }

  getTimelineIcon(changeType: string): string {
    switch (changeType) {
      case 'Created': return 'add_circle';
      case 'Updated': return 'edit';
      case 'StatusChanged': return 'swap_horiz';
      case 'Assigned': return 'swap_horiz';
      case 'DocumentAdded': return 'upload_file';
      case 'DocumentRemoved': return 'delete';
      default: return 'history';
    }
  }

  getTimelineIconBg(changeType: string): string {
    switch (changeType) {
      case 'Created': return 'bg-emerald-500';
      case 'Updated': return 'bg-blue-500';
      case 'StatusChanged': return 'bg-amber-500';
      case 'Assigned': return 'bg-cyan-500';
      case 'DocumentAdded': return 'bg-violet-500';
      case 'DocumentRemoved': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  }
}
