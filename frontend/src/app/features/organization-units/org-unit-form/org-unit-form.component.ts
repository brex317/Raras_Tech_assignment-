import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { OrgUnitSelectorComponent } from '../../../shared/components/org-unit-selector/org-unit-selector.component';
import { OrganizationUnitDto } from '../../../core/models/models';

export interface OrgUnitDialogData {
  unit?: OrganizationUnitDto;
}

@Component({
  selector: 'app-org-unit-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule,
    OrgUnitSelectorComponent
  ],
  template: `
    <h2 mat-dialog-title class="!font-semibold !text-slate-900">
      {{ data.unit ? 'Edit Organization Unit' : 'Create Organization Unit' }}
    </h2>
    
    <mat-dialog-content class="space-y-4">
      <form [formGroup]="orgUnitForm" class="space-y-4 pt-2">
        <!-- Name -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Unit Name</mat-label>
          <input matInput formControlName="name" placeholder="e.g. Sales Department" required>
          <mat-error *ngIf="orgUnitForm.get('name')?.hasError('required')">Name is required</mat-error>
          <mat-error *ngIf="orgUnitForm.get('name')?.hasError('maxlength')">Name must not exceed 100 characters</mat-error>
        </mat-form-field>

        <!-- Code -->
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Code (Unique identifier)</mat-label>
          <input matInput formControlName="code" placeholder="e.g. SLS-DEPT" required>
          <mat-error *ngIf="orgUnitForm.get('code')?.hasError('required')">Code is required</mat-error>
          <mat-error *ngIf="orgUnitForm.get('code')?.hasError('maxlength')">Code must not exceed 20 characters</mat-error>
          <mat-error *ngIf="orgUnitForm.get('code')?.hasError('pattern')">
            Code can only contain letters, numbers, and hyphens
          </mat-error>
        </mat-form-field>

        <!-- Parent Unit Selector -->
        <app-org-unit-selector 
          formControlName="parentId"
          label="Parent Unit"
          [showNone]="true">
        </app-org-unit-selector>

        <!-- Is Active (Edit Mode Only) -->
        <div *ngIf="data.unit" class="py-2">
          <mat-slide-toggle formControlName="isActive" color="primary">
            Active Status
          </mat-slide-toggle>
          <p class="text-xs text-slate-400 mt-1 font-sans">
            Inactivating a unit blocks assignments to it.
          </p>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="!pb-4 !px-6">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" [disabled]="orgUnitForm.invalid" (click)="onSave()" class="!rounded-lg shadow">
        Save
      </button>
    </mat-dialog-actions>
  `
})
export class OrgUnitFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<OrgUnitFormComponent>);

  readonly orgUnitForm = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    code: ['', [Validators.required, Validators.maxLength(20), Validators.pattern('^[A-Za-z0-9-]+$')]],
    parentId: [null as string | null],
    isActive: [true]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public readonly data: OrgUnitDialogData) {}

  ngOnInit(): void {
    if (this.data.unit) {
      this.orgUnitForm.patchValue({
        name: this.data.unit.name,
        code: this.data.unit.code,
        parentId: this.data.unit.parentId || null,
        isActive: this.data.unit.isActive
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.orgUnitForm.invalid) return;
    this.dialogRef.close(this.orgUnitForm.value);
  }
}
