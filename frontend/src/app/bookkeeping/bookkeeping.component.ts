import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { CombinedTransactionService, CombinedTransaction } from '../services/combined-transaction.service';
import { NotificationsComponent } from '../components/notifications/notifications.component';
import { HeaderComponent } from '../components/header/header.component';
import { StatisticsComponent } from '../components/statistics/statistics.component';
import { TransactionsTableComponent } from '../components/transactions-table/transactions-table.component';

@Component({
  selector: 'app-bookkeeping',
  standalone: true,
  imports: [
    CommonModule,
    NotificationsComponent,
    HeaderComponent,
    StatisticsComponent,
    TransactionsTableComponent
  ],
  template: `
    <div class="app-container">
      <!-- Notifications -->
      <app-notifications></app-notifications>
      
      <!-- Main Content -->
      <main class="main-content">
        <div class="container">
          <!-- Header -->
          <app-header [totalTransactions]="transactions.length"></app-header>

          <div class="page-header">
            <h1 class="page-title">לוח בקרה כספי</h1>
            <p class="page-description">ניהול ומעקב אחר הכנסות והוצאות עסקיות</p>
          </div>

          <!-- Statistics Row -->
          <app-statistics 
            [totalIncome]="totalIncome"
            [totalExpenses]="totalExpenses"
            [netProfit]="netProfit">
          </app-statistics>         

          <!-- Transactions Table -->
          <app-transactions-table></app-transactions-table>

        </div>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: var(--gray-50);
    }

    .main-content {
      padding: 2rem 0;
    }

    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .page-header {
      margin-bottom: 2rem;
      margin-top: 2rem;
      text-align: right;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--gray-900);
      margin-bottom: 0.5rem;
    }

    .page-description {
      color: var(--gray-600);
      font-size: 1.125rem;
    }

    .content-grid {
      display: grid;
      gap: 2rem;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      margin-top: 2rem;
      margin-bottom: 3rem;
    }
  `]
})
export class BookkeepingComponent implements OnInit, OnDestroy {
  transactions: CombinedTransaction[] = [];
  totalIncome = 0;
  totalExpenses = 0;
  netProfit = 0;
  
  private destroy$ = new Subject<void>();

  constructor(private transactionService: CombinedTransactionService) {}

  ngOnInit() {
    // Subscribe to transactions
    this.transactionService.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(transactions => {
        this.transactions = transactions;
        this.updateStatistics();
      });
    
    // Load initial data
    this.transactionService.loadTransactions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTransactionAdded(transaction: Omit<CombinedTransaction, 'id'>) {
    if (transaction.type === 'income') {
      this.transactionService.addIncomeTransaction(transaction as any);
    } else if (transaction.type === 'expense') {
      this.transactionService.addExpenseTransaction(transaction as any);
    }
  }

  private updateStatistics() {
    this.totalIncome = this.transactionService.getTotalIncome();
    this.totalExpenses = this.transactionService.getTotalExpenses();
    this.netProfit = this.transactionService.getNetProfit();
  }
}
