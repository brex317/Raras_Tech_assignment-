import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    MatIconModule,
    MatSlideToggleModule,
    OrgUnitSelectorComponent
  ],
  template: `
    <div class="dialog-wrap">

      <!-- Header -->
      <div class="dialog-header">
        <div class="dialog-icon-wrap">
          <mat-icon class="dialog-icon">account_tree</mat-icon>
        </div>
        <div>
          <h2 class="dialog-title">{{ data.unit ? 'Edit Organization Unit' : 'New Organization Unit' }}</h2>
          <p class="dialog-sub">{{ data.unit ? 'Update unit details' : 'Add a new unit to the hierarchy' }}</p>
        </div>
      </div>

      <!-- Body -->
      <div class="dialog-body">
        <form [formGroup]="orgUnitForm" class="space-y-4">

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Unit Name</mat-label>
            <input matInput formControlName="name" placeholder="e.g. Sales Department" required>
            <mat-error *ngIf="orgUnitForm.get('name')?.hasError('required')">Name is required</mat-error>
            <mat-error *ngIf="orgUnitForm.get('name')?.hasError('maxlength')">Max 100 characters</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="w-full">
            <mat-label>Code</mat-label>
            <input matInput formControlName="code" placeholder="e.g. SLS-DEPT" required>
            <mat-hint>Letters, numbers, and hyphens only</mat-hint>
            <mat-error *ngIf="orgUnitForm.get('code')?.hasError('required')">Code is required</mat-error>
            <mat-error *ngIf="orgUnitForm.get('code')?.hasError('maxlength')">Max 20 characters</mat-error>
            <mat-error *ngIf="orgUnitForm.get('code')?.hasError('pattern')">Invalid format</mat-error>
          </mat-form-field>

          <app-org-unit-selector
            formControlName="parentId"
            label="Parent Unit (optional)"
            [showNone]="true">
          </app-org-unit-selector>

          <div *ngIf="data.unit" class="toggle-row">
            <div>
              <p class="toggle-label">Active Status</p>
              <p class="toggle-sub">Inactive units cannot receive asset assignments</p>
            </div>
            <mat-slide-toggle formControlName="isActive" color="primary"></mat-slide-toggle>
          </div>

        </form>
      </div>

      <!-- Footer -->
      <div class="dialog-footer">
        <button class="cancel-btn" (click)="onCancel()">Cancel</button>
        <button class="submit-btn" [disabled]="orgUnitForm.invalid" (click)="onSave()">
          {{ data.unit ? 'Save Changes' : 'Create Unit' }}
        </button>
      </div>

    </div>
  `,
  styles: [`
    .dialog-wrap {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }

    /* ===== HEADER ===== */
    .dialog-header {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 20px 20px 0;
    }

    .dialog-icon-wrap {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: linear-gradient(135deg, #eef2ff, #ddd6fe);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .dialog-icon {
      color: #6366f1 !important;
      font-size: 22px !important;
      width: 22px !important;
      height: 22px !important;
    }

    .dialog-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.4;
    }

    .dialog-sub {
      font-size: 12px;
      color: #64748b;
      margin: 4px 0 0;
      line-height: 1.5;
    }

    /* ===== BODY ===== */
    .dialog-body {
      padding: 24px 20px;
      overflow-y: auto;
      flex: 1;
    }

    /* Form spacing */
    form {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    /* Toggle row */
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 16px;
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .toggle-label {
      font-size: 13.5px;
      font-weight: 600;
      color: #334155;
      margin: 0;
    }

    .toggle-sub {
      font-size: 11.5px;
      color: #94a3b8;
      margin: 4px 0 0;
      line-height: 1.4;
    }

    /* ===== FOOTER ===== */
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      padding: 16px 20px;
      border-top: 1px solid #f1f5f9;
      background: #fafbfc;
    }

    .cancel-btn {
      height: 38px;
      padding: 0 16px;
      border-radius: 9px;
      border: 1px solid #e2e8f0;
      background: #fff;
      font-size: 13px;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .cancel-btn:hover {
      border-color: #94a3b8;
      color: #334155;
      background: #f8fafc;
    }

    .submit-btn {
      height: 38px;
      padding: 0 20px;
      border-radius: 9px;
      border: none;
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      font-size: 13px;
      font-weight: 600;
      color: #fff;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
      transition: all 0.2s ease;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }

    .submit-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .submit-btn:disabled {
      background: #e2e8f0;
      color: #94a3b8;
      box-shadow: none;
      cursor: not-allowed;
    }

    /* ===== RESPONSIVE ===== */
    @media (min-width: 640px) {
      .dialog-header {
        padding: 24px 24px 0;
        gap: 14px;
      }

      .dialog-icon-wrap {
        width: 48px;
        height: 48px;
      }

      .dialog-title {
        font-size: 17px;
      }

      .dialog-sub {
        font-size: 13px;
      }

      .dialog-body {
        padding: 28px 24px;
      }

      .dialog-footer {
        padding: 18px 24px;
      }

      .cancel-btn,
      .submit-btn {
        height: 40px;
        font-size: 14px;
      }
    }
  `]
})
export class OrgUnitFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<OrgUnitFormComponent>);

  readonly orgUnitForm = this.fb.group({
    name:     ['', [Validators.required, Validators.maxLength(100)]],
    code:     ['', [Validators.required, Validators.maxLength(20), Validators.pattern('^[A-Za-z0-9-]+$')]],
    parentId: [null as string | null],
    isActive: [true]
  });

  constructor(@Inject(MAT_DIALOG_DATA) public readonly data: OrgUnitDialogData) {}

  ngOnInit(): void {
    if (this.data.unit) {
      this.orgUnitForm.patchValue({
        name:     this.data.unit.name,
        code:     this.data.unit.code,
        parentId: this.data.unit.parentId || null,
        isActive: this.data.unit.isActive
      });
    }
  }

  onCancel(): void { this.dialogRef.close(); }

  onSave(): void {
    if (this.orgUnitForm.invalid) return;
    this.dialogRef.close(this.orgUnitForm.value);
  }
}
