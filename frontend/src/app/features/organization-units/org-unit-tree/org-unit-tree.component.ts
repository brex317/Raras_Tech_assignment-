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
    <div class="space-y-6 animate-fade-in">
      
      <!-- Top Title and Action -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 class="text-2xl font-extrabold text-slate-800 font-sans tracking-tight">Organization Structure</h1>
          <p class="text-sm text-slate-500 font-sans">Manage your hierarchical organizational units and departments</p>
        </div>
        <button mat-raised-button color="primary" (click)="onCreateRoot()" *ngIf="isAdmin()" [disabled]="loading() || hasRoot()">
          <mat-icon class="mr-1">add</mat-icon> Create Root Unit
        </button>
      </div>

      <!-- Tree Container -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden relative min-h-[400px]">
        <mat-progress-bar *ngIf="loading()" mode="query" class="absolute top-0 left-0 right-0 z-10"></mat-progress-bar>
        
        <div class="p-6 md:p-8 space-y-2">
          <!-- Tree Nodes -->
          <div *ngIf="treeNodes().length > 0">
            <ng-container *ngFor="let node of treeNodes()">
              <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: node }"></ng-container>
            </ng-container>
          </div>

          <!-- Empty State -->
          <div *ngIf="treeNodes().length === 0 && !loading()" class="text-center py-16">
            <mat-icon class="!text-slate-300 !w-16 !h-16 !text-[64px] mb-4">account_tree</mat-icon>
            <p class="text-slate-500 font-medium font-sans">No organization units registered yet</p>
            <button mat-raised-button color="primary" (click)="onCreateRoot()" *ngIf="isAdmin()" class="mt-4">
              Create Root Unit
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Recursive Node Template -->
    <ng-template #nodeTemplate let-node>
      <div class="flex flex-col font-sans">
        <!-- Node Row -->
        <div class="group flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-200"
             [style.margin-left.px]="node.level * 24">
          
          <!-- Left side: Expand/Collapse & Name -->
          <div class="flex items-center space-x-3">
            <!-- Expand Button (if has children) -->
            <button mat-icon-button *ngIf="node.children && node.children.length > 0" 
                    (click)="toggleNode(node.id)" class="!w-8 !h-8 !leading-8">
              <mat-icon class="text-slate-500 transition-transform duration-200" [ngClass]="{'rotate-90': isExpanded(node.id)}">
                chevron_right
              </mat-icon>
            </button>
            <div *ngIf="!node.children || node.children.length === 0" class="w-8"></div>

            <!-- Folder/Dept Icon -->
            <mat-icon class="!text-indigo-500">
              {{ node.level === 0 ? 'corporate_fare' : (node.children?.length ? 'folder' : 'article') }}
            </mat-icon>

            <!-- Text & Info -->
            <div class="flex flex-col">
              <div class="flex items-center space-x-2">
                <span class="font-bold text-slate-800 text-sm md:text-base">{{ node.name }}</span>
                <span class="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-mono">
                  {{ node.code }}
                </span>
                <span *ngIf="!node.isActive" class="text-xs font-bold text-rose-500 uppercase tracking-widest">
                  (Inactive)
                </span>
              </div>
            </div>
          </div>

          <!-- Right side: Asset Count and Action Buttons -->
          <div class="flex items-center space-x-4">
            <!-- Asset Count Badge -->
            <span class="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full font-sans whitespace-nowrap">
              {{ node.assetCount }} {{ node.assetCount === 1 ? 'asset' : 'assets' }}
            </span>

            <!-- Actions (Admin only) -->
            <div class="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1" *ngIf="isAdmin()">
              <button mat-icon-button color="primary" (click)="onCreateChild(node)" title="Add sub-unit">
                <mat-icon>add_circle_outline</mat-icon>
              </button>
              <button mat-icon-button color="accent" (click)="onEdit(node)" title="Edit unit">
                <mat-icon>edit</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <!-- Render Children Recursively if Expanded -->
        <div *ngIf="isExpanded(node.id) && node.children && node.children.length > 0">
          <ng-container *ngFor="let child of node.children">
            <ng-container *ngTemplateOutlet="nodeTemplate; context: { $implicit: child }"></ng-container>
          </ng-container>
        </div>
      </div>
    </ng-template>
  `
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
        // By default expand the root node
        if (nodes.length > 0) {
          this.expandedNodeIds.update(set => {
            set.add(nodes[0].id);
            return new Set(set);
          });
        }
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  hasRoot(): boolean {
    return this.treeNodes().length > 0;
  }

  isExpanded(id: string): boolean {
    return this.expandedNodeIds().has(id);
  }

  toggleNode(id: string): void {
    this.expandedNodeIds.update(set => {
      if (set.has(id)) {
        set.delete(id);
      } else {
        set.add(id);
      }
      return new Set(set);
    });
  }

  isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'Administrator';
  }

  onCreateRoot(): void {
    this.openFormDialog();
  }

  onCreateChild(parent: OrganizationUnitTreeDto): void {
    this.openFormDialog(undefined, parent.id);
  }

  onEdit(node: OrganizationUnitTreeDto): void {
    // Fetch full details first to ensure we have parent ID
    this.loading.set(true);
    this.orgUnitService.getById(node.id).subscribe({
      next: (unit) => {
        this.loading.set(false);
        this.openFormDialog(unit);
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Error loading unit details.', 'Close', { duration: 4000 });
      }
    });
  }

  private openFormDialog(unit?: OrganizationUnitDto, parentId?: string): void {
    const dialogRef = this.dialog.open(OrgUnitFormComponent, {
      width: '450px',
      data: { unit }
    });

    // Preset parent ID if creating a child
    if (!unit && parentId) {
      dialogRef.componentInstance.orgUnitForm.patchValue({ parentId });
    }

    dialogRef.afterClosed().subscribe(formValue => {
      if (formValue) {
        this.loading.set(true);
        if (unit) {
          // Update
          const request = {
            name: formValue.name,
            code: formValue.code,
            isActive: formValue.isActive,
            parentId: formValue.parentId
          };

          this.orgUnitService.update(unit.id, request).subscribe({
            next: () => {
              this.loading.set(false);
              this.snackBar.open('Organization unit updated.', 'Close', { duration: 3000 });
              this.loadTree();
            },
            error: (err) => {
              this.loading.set(false);
              this.snackBar.open(err.error?.message || 'Error updating unit.', 'Close', { duration: 4000 });
            }
          });
        } else {
          // Create
          const request = {
            name: formValue.name,
            code: formValue.code,
            parentId: formValue.parentId
          };

          this.orgUnitService.create(request).subscribe({
            next: (created) => {
              this.loading.set(false);
              this.snackBar.open('Organization unit created.', 'Close', { duration: 3000 });
              this.loadTree();
              // Expand the parent so the new child is visible
              if (request.parentId) {
                this.expandedNodeIds.update(set => {
                  set.add(request.parentId!);
                  return new Set(set);
                });
              }
            },
            error: (err) => {
              this.loading.set(false);
              this.snackBar.open(err.error?.message || 'Error creating unit.', 'Close', { duration: 4000 });
            }
          });
        }
      }
    });
  }
}
