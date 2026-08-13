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
    <div class="space-y-5 animate-fade-in">

      <!-- Page header -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 class="page-title">Organization Structure</h1>
          <p class="page-sub">Manage your hierarchical organizational units and departments</p>
        </div>
        <button *ngIf="isAdmin()" [disabled]="loading() || hasRoot()"
                (click)="onCreateRoot()" class="submit-btn">
          <mat-icon class="btn-icon">add</mat-icon>
          Create Root Unit
        </button>
      </div>

      <!-- Tree card -->
      <div class="tree-card">
        <mat-progress-bar *ngIf="loading()" mode="query" class="absolute top-0 left-0 right-0 rounded-t-xl"></mat-progress-bar>

        <div class="p-5 md:p-6 space-y-0.5">

          <ng-container *ngIf="treeNodes().length > 0">
            <ng-container *ngFor="let node of treeNodes()">
              <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: node }"></ng-container>
            </ng-container>
          </ng-container>

          <!-- Empty state -->
          <div *ngIf="treeNodes().length === 0 && !loading()" class="empty-state">
            <mat-icon class="empty-icon">account_tree</mat-icon>
            <p class="empty-title">No organization units yet</p>
            <p class="empty-sub">Create a root unit to start building your hierarchy.</p>
            <button *ngIf="isAdmin()" (click)="onCreateRoot()" class="submit-btn mt-4">
              <mat-icon class="btn-icon">add</mat-icon>
              Create Root Unit
            </button>
          </div>

        </div>
      </div>
    </div>

    <!-- Recursive node template -->
    <ng-template #nodeTemplate let-node>
      <div>
        <div class="node-row group" [style.padding-left.px]="20 + node.level * 22">

          <!-- Expand toggle -->
          <button *ngIf="node.children?.length" (click)="toggleNode(node.id)"
                  class="expand-btn" [class.expanded]="isExpanded(node.id)">
            <mat-icon class="!text-[16px] !w-4 !h-4">chevron_right</mat-icon>
          </button>
          <div *ngIf="!node.children?.length" class="w-7"></div>

          <!-- Icon -->
          <mat-icon class="node-icon" [class.root-icon]="node.level === 0">
            {{ node.level === 0 ? 'corporate_fare' : (node.children?.length ? 'folder' : 'insert_drive_file') }}
          </mat-icon>

          <!-- Name + code -->
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <span class="node-name">{{ node.name }}</span>
            <span class="node-code">{{ node.code }}</span>
            <span *ngIf="!node.isActive" class="inactive-badge">Inactive</span>
          </div>

          <!-- Right side -->
          <div class="flex items-center gap-3 ml-auto shrink-0">
            <span class="asset-count">
              {{ node.assetCount }} {{ node.assetCount === 1 ? 'asset' : 'assets' }}
            </span>
            <div *ngIf="isAdmin()" class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button mat-icon-button (click)="onCreateChild(node)" title="Add sub-unit" class="action-icon-btn add">
                <mat-icon class="!text-[17px]">add_circle_outline</mat-icon>
              </button>
              <button mat-icon-button (click)="onEdit(node)" title="Edit" class="action-icon-btn edit">
                <mat-icon class="!text-[17px]">edit</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Children -->
        <div *ngIf="isExpanded(node.id) && node.children?.length">
          <ng-container *ngFor="let child of node.children">
            <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: child }"></ng-container>
          </ng-container>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .page-title { font-size: 20px; font-weight: 700; color: #0f172a; }
    .page-sub   { font-size: 13px; color: #64748b; margin-top: 2px; }

    .submit-btn {
      display: inline-flex; align-items: center; gap: 5px;
      height: 36px; padding: 0 16px; border-radius: 8px; border: none;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      font-size: 13px; font-weight: 600; color: #fff; cursor: pointer;
      box-shadow: 0 2px 8px rgb(99 102 241/.3);
      transition: opacity 0.15s;
    }
    .submit-btn:hover:not(:disabled) { opacity: 0.9; }
    .submit-btn:disabled { background: #e2e8f0; color: #94a3b8; box-shadow: none; cursor: not-allowed; }
    .btn-icon { font-size: 17px !important; width: 17px !important; height: 17px !important; }

    .tree-card {
      position: relative;
      background: #fff;
      border-radius: 12px;
      border: 1px solid #e9edf2;
      min-height: 300px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgb(0 0 0/.05);
    }

    /* Node row */
    .node-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-top: 7px;
      padding-bottom: 7px;
      padding-right: 12px;
      border-radius: 9px;
      transition: background 0.12s;
      cursor: default;
    }
    .node-row:hover { background: #f8fafc; }

    /* Expand button */
    .expand-btn {
      display: flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; border-radius: 6px;
      border: none; background: transparent; cursor: pointer;
      color: #64748b; flex-shrink: 0;
      transition: background 0.12s, transform 0.2s;
    }
    .expand-btn:hover { background: #f1f5f9; }
    .expand-btn.expanded mat-icon { transform: rotate(90deg); }
    .expand-btn mat-icon { transition: transform 0.2s; }

    /* Node icon */
    .node-icon {
      font-size: 18px !important; width: 18px !important; height: 18px !important;
      color: #94a3b8; flex-shrink: 0;
    }
    .root-icon { color: #6366f1 !important; }

    /* Node text */
    .node-name { font-size: 13.5px; font-weight: 600; color: #1e293b; }
    .node-code {
      font-size: 11px; font-weight: 600; padding: 2px 7px;
      border-radius: 5px; background: #f1f5f9; color: #64748b;
      font-family: monospace; letter-spacing: 0.03em; flex-shrink: 0;
    }
    .inactive-badge {
      font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 10px;
      background: #fff1f2; color: #be123c; letter-spacing: 0.04em;
    }

    /* Asset count */
    .asset-count {
      font-size: 11.5px; font-weight: 600; padding: 3px 9px;
      border-radius: 20px; background: #eef2ff; color: #4f46e5;
      white-space: nowrap;
    }

    /* Action icon buttons */
    .action-icon-btn { transition: none !important; }
    .action-icon-btn.add { color: #6366f1 !important; }
    .action-icon-btn.edit { color: #06b6d4 !important; }

    /* Empty state */
    .empty-state { text-align: center; padding: 56px 24px; }
    .empty-icon  { font-size: 44px !important; width: 44px !important; height: 44px !important; color: #cbd5e1 !important; }
    .empty-title { font-size: 14px; font-weight: 600; color: #475569; margin: 12px 0 4px; }
    .empty-sub   { font-size: 12.5px; color: #94a3b8; }
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

  onCreateRoot(): void { this.openFormDialog(); }

  onCreateChild(parent: OrganizationUnitTreeDto): void { this.openFormDialog(undefined, parent.id); }

  onEdit(node: OrganizationUnitTreeDto): void {
    this.loading.set(true);
    this.orgUnitService.getById(node.id).subscribe({
      next: (unit) => { this.loading.set(false); this.openFormDialog(unit); },
      error: () => { this.loading.set(false); this.snackBar.open('Error loading unit.', 'Close', { duration: 4000 }); }
    });
  }

  private openFormDialog(unit?: OrganizationUnitDto, parentId?: string): void {
    const dialogRef = this.dialog.open(OrgUnitFormComponent, { width: '440px', data: { unit } });
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
