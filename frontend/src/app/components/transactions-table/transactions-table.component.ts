import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { TransactionService, Transaction } from '../../services/transaction.service';

@Component({
  selector: 'app-transactions-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="card transactions-card">
      <div class="card-header">
        <h3 class="card-title">
          <svg class="card-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3,3H21V5H3V3M3,7H21V9H3V7M3,11H21V13H3V11M3,15H21V17H3V15M3,19H21V21H3V19Z"/>
          </svg>
          רשימת עסקאות ({{transactions.length}})
        </h3>
        <div class="card-actions">
          <button (click)="exportToExcel()" class="btn btn--secondary" [disabled]="transactions.length === 0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
            </svg>
            ייצא Excel
          </button>
          <button (click)="clearAllData()" class="btn btn--danger" [disabled]="transactions.length === 0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/>
            </svg>
            נקה הכל
          </button>
        </div>
      </div>
      
      <div class="card-body" [class.no-padding]="transactions.length > 0">
        <div class="table-container" *ngIf="transactions.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>תאריך</th>
                <th>תיאור</th>
                <th>סכום</th>
                <th>סוג</th>
                <th>לקוח/ספק</th>
                <th class="actions-col">פעולות</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let transaction of transactions; let i = index" 
                  [class.row--income]="transaction.type === 'income'"
                  [class.row--expense]="transaction.type === 'expense'">
                <td class="cell--date">{{transaction.date | date:'dd/MM/yyyy'}}</td>
                <td class="cell--description">{{transaction.description}}</td>
                <td class="cell--amount" [class]="'amount--' + transaction.type">
                  {{transaction.amount | number:'1.2-2'}} ₪
                </td>
                <td class="cell--type">
                  <span class="badge" [class]="'badge--' + transaction.type">
                    {{transaction.type === 'income' ? 'הכנסה' : 'הוצאה'}}
                  </span>
                </td>
                <td class="cell--client">{{transaction.client}}</td>
                <td class="cell--actions">
                  <button 
                    (click)="deleteTransaction(i)" 
                    class="btn btn--danger btn--sm"
                    title="מחק עסקה">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M7,6H17V19H7V6M9,8V17H11V8H9M13,8V17H15V8H13Z"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div *ngIf="transactions.length === 0" class="empty-state">
          <svg class="empty-icon" width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3M19,19H5V5H19V19Z"/>
          </svg>
          <h4>אין עסקאות עדיין</h4>
          <p>התחל בהוספת עסקה חדשה באמצעות הטופס למעלה או העלה קובץ Excel/JSON</p>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .card {
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .transactions-card {
      grid-column: 1 / -1;
    }

    .card-header {
      background: var(--gray-50);
      border-bottom: 1px solid var(--border-color);
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--gray-900);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .card-icon {
      color: var(--gray-500);
    }

    .card-body {
      padding: 1.5rem;
    }

    .card-body.no-padding {
      padding: 0;
    }

    .card-actions {
      display: flex;
      gap: 0.75rem;
    }

    /* Table */
    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .data-table th {
      background: var(--gray-50);
      border-bottom: 1px solid var(--border-color);
      padding: 0.875rem 1rem;
      text-align: right;
      font-weight: 600;
      color: var(--gray-700);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .data-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--gray-100);
      text-align: right;
      vertical-align: middle;
    }

    .data-table tr:hover {
      background: var(--gray-50);
    }

    .row--income {
      background: rgba(56, 161, 105, 0.03);
    }

    .row--expense {
      background: rgba(229, 62, 62, 0.03);
    }

    .amount--income {
      color: var(--success-color);
      font-weight: 600;
    }

    .amount--expense {
      color: var(--danger-color);
      font-weight: 600;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .badge--income {
      background: rgba(56, 161, 105, 0.1);
      color: var(--success-color);
    }

    .badge--expense {
      background: rgba(229, 62, 62, 0.1);
      color: var(--danger-color);
    }

    .actions-col {
      width: 100px;
      text-align: center;
    }

    .cell--actions {
      text-align: center;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid transparent;
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: var(--transition);
      text-decoration: none;
      white-space: nowrap;
      user-select: none;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn:active:not(:disabled) {
      transform: translateY(1px);
    }

    .btn--secondary {
      background: var(--white);
      color: var(--gray-700);
      border-color: var(--border-color);
    }

    .btn--secondary:hover:not(:disabled) {
      background: var(--gray-50);
      border-color: var(--gray-300);
      color: var(--gray-800);
    }

    .btn--danger {
      background: var(--danger-color);
      color: var(--white);
      border-color: var(--danger-color);
    }

    .btn--danger:hover:not(:disabled) {
      background: #c53030;
      border-color: #c53030;
    }

    .btn--sm {
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--gray-500);
    }

    .empty-icon {
      margin-bottom: 1.5rem;
      color: var(--gray-300);
    }

    .empty-state h4 {
      font-size: 1.125rem;
      color: var(--gray-700);
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      margin: 0;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
      line-height: 1.5;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .card-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .card-actions {
        justify-content: center;
      }

      .data-table {
        font-size: 0.75rem;
      }

      .data-table th,
      .data-table td {
        padding: 0.5rem;
      }

      .btn {
        font-size: 0.75rem;
        padding: 0.625rem 1rem;
      }
    }
  `]
})
export class TransactionsTableComponent implements OnInit, OnDestroy {
  transactions: Transaction[] = [];
  private destroy$ = new Subject<void>();

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    this.transactionService.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(transactions => {
        this.transactions = transactions;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  deleteTransaction(index: number) {
    this.transactionService.deleteTransaction(index);
  }

  clearAllData() {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל הנתונים?')) {
      this.transactionService.clearAllData();
    }
  }

  exportToExcel() {
    this.transactionService.exportToExcel();
  }
}
