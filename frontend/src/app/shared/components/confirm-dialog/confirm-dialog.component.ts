import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="dialog-wrap">
      
      <!-- Header -->
      <div class="dialog-header">
        <div class="dialog-icon-wrap" [class.danger]="data.type === 'danger'" 
             [class.warning]="data.type === 'warning'">
          <mat-icon class="dialog-icon">
            {{ data.type === 'danger' ? 'warning' : (data.type === 'warning' ? 'info' : 'help_outline') }}
          </mat-icon>
        </div>
        <div class="flex-1">
          <h2 class="dialog-title">{{ data.title }}</h2>
        </div>
      </div>

      <!-- Body -->
      <div class="dialog-body">
        <p class="dialog-message">{{ data.message }}</p>
      </div>

      <!-- Footer -->
      <div class="dialog-footer">
        <button class="cancel-btn" (click)="onCancel()">
          {{ data.cancelText || 'Cancel' }}
        </button>
        <button class="confirm-btn" [class.danger]="data.type === 'danger'" (click)="onConfirm()">
          {{ data.confirmText || 'Confirm' }}
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
      align-items: center;
      gap: 14px;
      padding: 20px 20px 0;
    }

    .dialog-icon-wrap {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #eef2ff, #ddd6fe);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .dialog-icon-wrap.danger {
      background: linear-gradient(135deg, #fee2e2, #fecaca);
    }

    .dialog-icon-wrap.warning {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
    }

    .dialog-icon {
      color: #6366f1 !important;
      font-size: 24px !important;
      width: 24px !important;
      height: 24px !important;
    }

    .dialog-icon-wrap.danger .dialog-icon {
      color: #dc2626 !important;
    }

    .dialog-icon-wrap.warning .dialog-icon {
      color: #d97706 !important;
    }

    .dialog-title {
      font-size: 17px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      line-height: 1.4;
    }

    /* ===== BODY ===== */
    .dialog-body {
      padding: 20px 20px;
      flex: 1;
      overflow-y: auto;
    }

    .dialog-message {
      font-size: 14px;
      color: #475569;
      line-height: 1.6;
      margin: 0;
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

    .confirm-btn {
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

    .confirm-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
    }

    .confirm-btn:active {
      transform: translateY(0);
    }

    .confirm-btn.danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
    }

    .confirm-btn.danger:hover {
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    }

    /* ===== RESPONSIVE ===== */
    @media (min-width: 640px) {
      .dialog-header {
        padding: 24px 24px 0;
      }

      .dialog-body {
        padding: 24px 24px;
      }

      .dialog-footer {
        padding: 18px 24px;
      }

      .cancel-btn,
      .confirm-btn {
        height: 40px;
        font-size: 14px;
      }
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}
