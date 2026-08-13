import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrganizationUnitService } from '../../../core/services/organization-unit.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrganizationUnitTreeDto, OrganizationUnitDto } from '../../../core/models/models';
import { OrgUnitFormComponent } from '../org-unit-form/org-unit-form.component';

@Component({
  selector: 'app-org-unit-tree',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="page-container">

      <!-- Page header -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">
              <mat-icon class="title-icon">account_tree</mat-icon>
              Organization Structure
            </h1>
            <p class="page-sub">Manage your hierarchical organizational units and departments</p>
          </div>
        </div>
      </div>

      <!-- Tree card -->
      <div class="tree-card">
        <mat-progress-bar *ngIf="loading()" mode="query" class="loading-bar"></mat-progress-bar>

        <div class="tree-content">

          <ng-container *ngIf="treeNodes().length > 0">
            <ng-container *ngFor="let node of treeNodes()">
              <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: node }"></ng-container>
            </ng-container>
          </ng-container>

          <!-- Empty state -->
          <div *ngIf="treeNodes().length === 0 && !loading()" class="empty-state">
            <div class="empty-icon-wrap">
              <mat-icon class="empty-icon">account_tree</mat-icon>
            </div>
            <p class="empty-title">No organization units yet</p>
            <p class="empty-sub">Organization units will appear here once they are created.</p>
          </div>

        </div>
      </div>
    </div>

    <!-- Recursive node template -->
    <ng-template #nodeTemplate let-node>
      <div class="node-container">
        <div class="node-row" [style.padding-left]="getNodePadding(node.level)">

          <!-- Expand toggle -->
          <button *ngIf="node.children?.length" (click)="toggleNode(node.id)"
                  class="expand-btn" [class.expanded]="isExpanded(node.id)"
                  [attr.aria-label]="isExpanded(node.id) ? 'Collapse' : 'Expand'">
            <mat-icon class="expand-icon">chevron_right</mat-icon>
          </button>
          <div *ngIf="!node.children?.length" class="expand-spacer"></div>

          <!-- Icon -->
          <mat-icon class="node-icon" [class.root-icon]="node.level === 0">
            {{ node.level === 0 ? 'corporate_fare' : (node.children?.length ? 'folder' : 'insert_drive_file') }}
          </mat-icon>

          <!-- Name + code + badges -->
          <div class="node-info">
            <div class="node-main">
              <span class="node-name">{{ node.name }}</span>
              <span class="node-code">{{ node.code }}</span>
              <span *ngIf="!node.isActive" class="inactive-badge">Inactive</span>
            </div>
            <span class="asset-count mobile-only">
              <mat-icon class="count-icon">inventory_2</mat-icon>
              {{ node.assetCount }} {{ node.assetCount === 1 ? 'asset' : 'assets' }}
            </span>
          </div>

          <!-- Right side actions -->
          <div class="node-actions">
            <span class="asset-count desktop-only">
              <mat-icon class="count-icon">inventory_2</mat-icon>
              {{ node.assetCount }}
            </span>
            <div *ngIf="isAdmin()" class="action-buttons">
              <button mat-icon-button (click)="onCreateChild(node)" 
                      title="Add sub-unit" class="action-icon-btn add"
                      [attr.aria-label]="'Add sub-unit to ' + node.name">
                <mat-icon>add_circle_outline</mat-icon>
              </button>
              <button mat-icon-button (click)="onEdit(node)" 
                      title="Edit" class="action-icon-btn edit"
                      [attr.aria-label]="'Edit ' + node.name">
                <mat-icon>edit</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Children -->
        <div *ngIf="isExpanded(node.id) && node.children?.length" class="node-children">
          <ng-container *ngFor="let child of node.children">
            <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: child }"></ng-container>
          </ng-container>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    /* ===== PAGE CONTAINER ===== */
    .page-container {
      padding: 16px;
      max-width: 1400px;
      margin: 0 auto;
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ===== PAGE HEADER ===== */
    .page-header {
      margin-bottom: 20px;
    }

    .header-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }

    .header-text {
      flex: 1;
      min-width: 0;
    }

    .page-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.3;
    }

    .title-icon {
      font-size: 26px !important;
      width: 26px !important;
      height: 26px !important;
      color: #6366f1 !important;
    }

    .page-sub {
      font-size: 13px;
      color: #64748b;
      margin: 6px 0 0;
      line-height: 1.5;
    }

    /* ===== TREE CARD ===== */
    .tree-card {
      position: relative;
      background: #fff;
      border-radius: 16px;
      border: 1px solid #e9edf2;
      min-height: 350px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
      transition: box-shadow 0.2s ease;
    }

    .tree-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }

    .loading-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      border-radius: 16px 16px 0 0;
      z-index: 10;
    }

    .tree-content {
      padding: 20px 16px;
    }

    /* ===== NODE STYLES ===== */
    .node-container {
      margin-bottom: 2px;
    }

    .node-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px 10px 16px;
      border-radius: 10px;
      transition: all 0.15s ease;
      cursor: default;
      position: relative;
    }

    .node-row:hover {
      background: linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%);
    }

    .node-row:hover .action-buttons {
      opacity: 1;
      pointer-events: auto;
    }

    /* Expand button */
    .expand-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 7px;
      border: none;
      background: transparent;
      cursor: pointer;
      color: #64748b;
      flex-shrink: 0;
      transition: all 0.2s ease;
      padding: 0;
    }

    .expand-btn:hover {
      background: #e0e7ff;
      color: #4f46e5;
    }

    .expand-btn.expanded .expand-icon {
      transform: rotate(90deg);
    }

    .expand-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
      transition: transform 0.25s ease;
    }

    .expand-spacer {
      width: 28px;
      flex-shrink: 0;
    }

    /* Node icon */
    .node-icon {
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
      color: #94a3b8;
      flex-shrink: 0;
    }

    .root-icon {
      color: #6366f1 !important;
      font-size: 22px !important;
      width: 22px !important;
      height: 22px !important;
    }

    /* Node info section */
    .node-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .node-main {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .node-name {
      font-size: 14px;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.4;
    }

    .node-code {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      background: #f1f5f9;
      color: #64748b;
      font-family: 'Courier New', monospace;
      letter-spacing: 0.5px;
      flex-shrink: 0;
    }

    .inactive-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 12px;
      background: #fff1f2;
      color: #be123c;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    /* Node actions */
    .node-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-left: auto;
      flex-shrink: 0;
    }

    .asset-count {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 600;
      padding: 5px 12px;
      border-radius: 20px;
      background: #eef2ff;
      color: #4f46e5;
      white-space: nowrap;
    }

    .count-icon {
      font-size: 14px !important;
      width: 14px !important;
      height: 14px !important;
    }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 4px;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease;
    }

    .action-icon-btn {
      transition: all 0.2s ease !important;
      width: 32px !important;
      height: 32px !important;
    }

    .action-icon-btn mat-icon {
      font-size: 18px !important;
      width: 18px !important;
      height: 18px !important;
    }

    .action-icon-btn.add {
      color: #6366f1 !important;
    }

    .action-icon-btn.add:hover {
      background: #eef2ff !important;
    }

    .action-icon-btn.edit {
      color: #06b6d4 !important;
    }

    .action-icon-btn.edit:hover {
      background: #ecfeff !important;
    }

    .node-children {
      margin-top: 2px;
    }

    /* ===== EMPTY STATE ===== */
    .empty-state {
      text-align: center;
      padding: 60px 24px;
    }

    .empty-icon-wrap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
      margin-bottom: 16px;
    }

    .empty-icon {
      font-size: 40px !important;
      width: 40px !important;
      height: 40px !important;
      color: #94a3b8 !important;
    }

    .empty-title {
      font-size: 16px;
      font-weight: 700;
      color: #334155;
      margin: 0 0 8px;
    }

    .empty-sub {
      font-size: 13px;
      color: #94a3b8;
      margin: 0;
      line-height: 1.6;
    }

    /* ===== RESPONSIVE UTILITIES ===== */
    .mobile-only {
      display: flex;
    }

    .desktop-only {
      display: none;
    }

    /* ===== MEDIA QUERIES ===== */
    
    /* Tablets and up (640px+) */
    @media (min-width: 640px) {
      .page-container {
        padding: 24px;
      }

      .header-content {
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .page-title {
        font-size: 24px;
      }

      .title-icon {
        font-size: 28px !important;
        width: 28px !important;
        height: 28px !important;
      }

      .page-sub {
        font-size: 14px;
      }

      .tree-content {
        padding: 24px 20px;
      }

      .node-row {
        padding: 12px 16px 12px 20px;
      }

      .mobile-only {
        display: none;
      }

      .desktop-only {
        display: inline-flex;
      }
    }

    /* Desktop (768px+) */
    @media (min-width: 768px) {
      .page-container {
        padding: 32px;
      }

      .page-header {
        margin-bottom: 24px;
      }

      .tree-content {
        padding: 28px 24px;
      }

      .node-name {
        font-size: 14.5px;
      }

      .empty-state {
        padding: 80px 32px;
      }
    }

    /* Large desktop (1024px+) */
    @media (min-width: 1024px) {
      .page-container {
        padding: 40px;
      }

      .page-title {
        font-size: 26px;
      }

      .tree-content {
        padding: 32px 28px;
      }
    }

    /* Extra large screens (1280px+) */
    @media (min-width: 1280px) {
      .tree-content {
        padding: 36px 32px;
      }
    }
  `]
})
export class OrgUnitTreeComponent implements OnInit {
  private readonly orgUnitService = inject(OrganizationUnitService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly treeNodes = signal<OrganizationUnitTreeDto[]>([]);
  readonly loading = signal(false);
  readonly expandedNodeIds = signal<Set<string>>(new Set<string>());

  ngOnInit(): void {
    this.loadTree();
  }

  loadTree(): void {
    this.loading.set(true);
    this.orgUnitService.getTree().subscribe({
      next: (nodes) => {
        this.treeNodes.set(nodes);
        this.loading.set(false);
        if (nodes.length > 0) {
          this.expandedNodeIds.update(set => { set.add(nodes[0].id); return new Set(set); });
        }
      },
      error: () => this.loading.set(false)
    });
  }

  hasRoot(): boolean { return this.treeNodes().length > 0; }
  isExpanded(id: string): boolean { return this.expandedNodeIds().has(id); }
  isAdmin(): boolean { return this.authService.currentUser()?.role === 'Administrator'; }

  toggleNode(id: string): void {
    this.expandedNodeIds.update(set => {
      set.has(id) ? set.delete(id) : set.add(id);
      return new Set(set);
    });
  }

  getNodePadding(level: number): string {
    const baseIndent = level * 24;
    return `${baseIndent}px`;
  }

  onCreateChild(parent: OrganizationUnitTreeDto): void { this.openFormDialog(undefined, parent.id); }

  onEdit(node: OrganizationUnitTreeDto): void {
    this.loading.set(true);
    this.orgUnitService.getById(node.id).subscribe({
      next: (unit) => { this.loading.set(false); this.openFormDialog(unit); },
      error: () => { this.loading.set(false); this.snackBar.open('Error loading unit.', 'Close', { duration: 4000 }); }
    });
  }

  private openFormDialog(unit?: OrganizationUnitDto, parentId?: string): void {
    const dialogRef = this.dialog.open(OrgUnitFormComponent, { 
      width: '90vw',
      maxWidth: '500px',
      data: { unit } 
    });
    if (!unit && parentId) dialogRef.componentInstance.orgUnitForm.patchValue({ parentId });

    dialogRef.afterClosed().subscribe(formValue => {
      if (!formValue) return;
      this.loading.set(true);

      if (unit) {
        this.orgUnitService.update(unit.id, { name: formValue.name, code: formValue.code, isActive: formValue.isActive, parentId: formValue.parentId }).subscribe({
          next: () => { this.loading.set(false); this.snackBar.open('Unit updated.', 'Close', { duration: 3000 }); this.loadTree(); },
          error: (err) => { this.loading.set(false); this.snackBar.open(err.error?.message || 'Error updating unit.', 'Close', { duration: 4000 }); }
        });
      } else {
        this.orgUnitService.create({ name: formValue.name, code: formValue.code, parentId: formValue.parentId }).subscribe({
          next: () => {
            this.loading.set(false);
            this.snackBar.open('Unit created.', 'Close', { duration: 3000 });
            this.loadTree();
            if (formValue.parentId) {
              this.expandedNodeIds.update(set => { set.add(formValue.parentId!); return new Set(set); });
            }
          },
          error: (err) => { this.loading.set(false); this.snackBar.open(err.error?.message || 'Error creating unit.', 'Close', { duration: 4000 }); }
        });
      }
    });
  }
}
