import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="app-header">
      <div class="container">
        <div class="header-content">
          <div class="brand">
            <div class="brand-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
            </div>
            <div class="brand-text">
              <h1>מערכת הנהלת חשבונות</h1>
              <span class="brand-subtitle">ניהול כספי מקצועי</span>
            </div>
          </div>
          
          <div class="header-info">
            <div class="summary-item">
              <span class="summary-label">סה"כ עסקאות</span>
              <span class="summary-value">{{totalTransactions}}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .app-header {
      background: var(--white);
      border-bottom: 1px solid var(--border-color);
      box-shadow: var(--shadow-sm);
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 0;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .brand-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: var(--primary-color);
      color: var(--white);
      border-radius: var(--border-radius-lg);
    }

    .brand-text h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--gray-900);
      margin: 0;
      line-height: 1.2;
    }

    .brand-subtitle {
      font-size: 0.875rem;
      color: var(--gray-600);
    }

    .header-info {
      display: flex;
      gap: 1.5rem;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .summary-label {
      font-size: 0.75rem;
      color: var(--gray-500);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
    }

    .summary-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary-color);
      margin-top: 0.25rem;
    }

    @media (max-width: 768px) {
      .container {
        padding: 0 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .brand {
        flex-direction: column;
        text-align: center;
      }
    }

    @media (max-width: 480px) {
      .brand-text h1 {
        font-size: 1.25rem;
      }
    }
  `]
})
export class HeaderComponent {
  @Input() totalTransactions: number = 0;
}
