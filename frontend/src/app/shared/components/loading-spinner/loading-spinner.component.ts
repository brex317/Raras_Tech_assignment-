import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible" class="spinner-wrap">
      <div class="spinner-ring">
        <svg class="animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
          <path class="arc" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      </div>
      <span class="spinner-msg">{{ message || 'Loading…' }}</span>
    </div>
  `,
  styles: [`
    .spinner-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 24px;
      gap: 12px;
    }

    .spinner-ring {
      width: 36px;
      height: 36px;
      color: #6366f1;
    }

    .spinner-ring svg {
      width: 36px;
      height: 36px;
    }

    .track  { opacity: 0.2; }
    .arc    { opacity: 0.85; }

    .spinner-msg {
      font-size: 13px;
      font-weight: 500;
      color: #94a3b8;
    }
  `]
})
export class LoadingSpinnerComponent {
  @Input() visible = true;
  @Input() message?: string;
}
