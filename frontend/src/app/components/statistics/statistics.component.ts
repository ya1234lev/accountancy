import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-row">
      <div class="stat-card stat-card--income clickable" (click)="navigateToIncome()">
        <div class="stat-card__content">
          <div class="stat-card__header">
            <span class="stat-card__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
              </svg>
            </span>
            <span class="stat-card__title">הכנסות</span>
          </div>
          <div class="stat-card__value">{{totalIncome | number:'1.2-2'}} ₪</div>
          <div class="stat-card__action">לחץ לניהול הכנסות</div>
        </div>
      </div>

       

  <div class="stat-card stat-card--expense clickable" (click)="navigateToExpense()">
    <div class="stat-card__content">
      <div class="stat-card__header">
        <span class="stat-card__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z"/>
          </svg>
        </span>
        <span class="stat-card__title">הוצאות</span>
      </div>
      <div class="stat-card__value">{{totalExpenses | number:'1.2-2'}} ₪</div>
      <div class="stat-card__action ">לחץ לניהול הוצאות</div>
    </div>
  </div>

      <div class="stat-card stat-card--profit">
        <div class="stat-card__content">
          <div class="stat-card__header">
            <span class="stat-card__icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </span>
            <span class="stat-card__title">יתרה</span>
          </div>
          <div class="stat-card__value">{{netProfit | number:'1.2-2'}} ₪</div>
        </div>
      </div>
    <!-- </div> -->
  `,
  styles: [`
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      padding: 1.5rem;
      box-shadow: var(--shadow-sm);
      transition: var(--transition);
    }

    .stat-card.clickable {
      cursor: pointer;
    }


    .stat-card.clickable:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-lg);
    }

    .stat-card--income.clickable:hover {
      border-color: var(--success-color);
    }
    .stat-card--expense.clickable:hover {
      border-color: var(--danger-color);
    }
    .stat-card--profit.clickable:hover {
      border-color: var(--accent-color);
    }

    .stat-card:hover {
      box-shadow: var(--shadow-md);
    }

    .stat-card--income {
      border-right: 4px solid var(--success-color);
    }

    .stat-card--expense {
      border-right: 4px solid var(--danger-color);
    }

    .stat-card--profit {
      border-right: 4px solid var(--accent-color);
    }

    .stat-card__content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .stat-card__header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .stat-card__icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: var(--border-radius);
      background: var(--gray-100);
      color: var(--gray-600);
    }

    .stat-card--income .stat-card__icon {
      background: rgba(56, 161, 105, 0.1);
      color: var(--success-color);
    }

    .stat-card--expense .stat-card__icon {
      background: rgba(229, 62, 62, 0.1);
      color: var(--danger-color);
    }

    .stat-card--profit .stat-card__icon {
      background: rgba(30, 64, 175, 0.1);
      color: var(--accent-color);
    }

    .stat-card__title {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--gray-600);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .stat-card__value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--gray-900);
      line-height: 1;
    }


    .stat-card__action {
      font-size: 0.8rem;
      font-weight: 500;
      margin-top: 0.5rem;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .stat-card__action--expense {
      color: var(--danger-color);
    }
    .stat-card__action--income {
      color: var(--success-color);
    }
    .stat-card.clickable:hover .stat-card__action {
      opacity: 1;
    }

    @media (max-width: 768px) {
      .stats-row {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 480px) {
      .stat-card__value {
        font-size: 1.5rem;
      }
    }
  `]
})
export class StatisticsComponent {
  @Input() totalIncome: number = 0;
  @Input() totalExpenses: number = 0;
  @Input() netProfit: number = 0;

  constructor(private router: Router) { }

  navigateToIncome(): void {
    this.router.navigate(['/income']);
  }

  navigateToExpense(): void {
    this.router.navigate(['/expense']);
  }
}
