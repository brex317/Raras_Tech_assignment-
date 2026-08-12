import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div *ngIf="visible" class="flex flex-col items-center justify-center p-8 space-y-4">
      <mat-spinner diameter="40" strokeWidth="4" color="primary"></mat-spinner>
      <span class="text-sm font-medium text-slate-500 font-sans">{{ message || 'Loading data...' }}</span>
    </div>
  `
})
export class LoadingSpinnerComponent {
  @Input() visible = true;
  @Input() message?: string;
}
