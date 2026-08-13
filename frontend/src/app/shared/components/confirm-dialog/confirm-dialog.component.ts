import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-wrap">

      <!-- Header -->
      <div class="dialog-header">
        <div class="warn-icon-wrap">
          <mat-icon class="warn-icon">warning_amber</mat-icon>
        </div>
        <div>
          <h2 class="dialog-title">{{ data.title }}</h2>
        </div>
      </div>

      <!-- Body -->
      <div class="dialog-body">
        <p class="dialog-msg">{{ data.message }}</p>
      </div>

      <!-- Footer -->
      <div class="dialog-footer">
        <button class="cancel-btn" (click)="onCancel()">{{ data.cancelText || 'Cancel' }}</button>
        <button class="danger-btn" (click)="onConfirm()">{{ data.confirmText || 'Confirm' }}</button>
      </div>

    </div>
  `,
  styles: [`
    .dialog-wrap { display: flex; flex-direction: column; min-width: 340px; }

    .dialog-header {
      display: flex; align-items: center; gap: 14px;
      padding: 20px 24px 0;
    }
    .warn-icon-wrap {
      width: 40px; height: 40px; border-radius: 10px;
      background: #fff1f2;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .warn-icon { color: #f43f5e !important; font-size: 20px !important; width: 20px !important; height: 20px !important; }
    .dialog-title { font-size: 15px; font-weight: 700; color: #0f172a; margin: 0; }

    .dialog-body { padding: 14px 24px 20px; }
    .dialog-msg  { font-size: 13.5px; color: #475569; line-height: 1.6; margin: 0; }

    .dialog-footer {
      display: flex; justify-content: flex-end; gap: 10px;
      padding: 16px 24px;
      border-top: 1px solid #f1f5f9;
    }

    .cancel-btn {
      height: 36px; padding: 0 16px; border-radius: 8px;
      border: 1px solid #e2e8f0; background: #fff;
      font-size: 13px; font-weight: 500; color: #64748b;
      cursor: pointer; transition: border-color 0.15s;
    }
    .cancel-btn:hover { border-color: #94a3b8; color: #334155; }

    .danger-btn {
      height: 36px; padding: 0 20px; border-radius: 8px; border: none;
      background: linear-gradient(135deg, #f43f5e, #e11d48);
      font-size: 13px; font-weight: 600; color: #fff;
      cursor: pointer; box-shadow: 0 2px 8px rgb(244 63 94/.3);
      transition: opacity 0.15s;
    }
    .danger-btn:hover { opacity: 0.9; }
  `]
})
export class ConfirmDialogComponent {
  constructor(
    private readonly dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public readonly data: ConfirmDialogData
  ) {}

  onCancel(): void  { this.dialogRef.close(false); }
  onConfirm(): void { this.dialogRef.close(true); }
}
