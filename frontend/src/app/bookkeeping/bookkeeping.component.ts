import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { TransactionService, Transaction } from '../services/transaction.service';
import { NotificationsComponent } from '../components/notifications/notifications.component';
import { HeaderComponent } from '../components/header/header.component';
import { StatisticsComponent } from '../components/statistics/statistics.component';
import { TransactionFormComponent } from '../components/transaction-form/transaction-form.component';
import { FileUploadComponent } from '../components/file-upload/file-upload.component';
import { TransactionsTableComponent } from '../components/transactions-table/transactions-table.component';

@Component({
  selector: 'app-bookkeeping',
  standalone: true,
  imports: [
    CommonModule,
    NotificationsComponent,
    HeaderComponent,
    StatisticsComponent,
    TransactionFormComponent,
    FileUploadComponent,
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
            <h1 class="page-title">ניהול הנהלת חשבונות</h1>
            <p class="page-description">ניהול ומעקב אחר הכנסות והוצאות עסקיות</p>
          </div>

          <!-- Statistics Row -->
          <app-statistics 
            [totalIncome]="totalIncome"
            [totalExpenses]="totalExpenses"
            [netProfit]="netProfit">
          </app-statistics>

          <!-- Content Grid -->
          <div class="content-grid">
            <!-- File Upload -->
            <app-file-upload></app-file-upload>
            
            <!-- Add Transaction Form -->
            <app-transaction-form (transactionAdded)="onTransactionAdded($event)"></app-transaction-form>
          </div>

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
      text-align: center;
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
  transactions: Transaction[] = [];
  totalIncome = 0;
  totalExpenses = 0;
  netProfit = 0;
  
  private destroy$ = new Subject<void>();

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    // Subscribe to transactions
    this.transactionService.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(transactions => {
        this.transactions = transactions;
        this.updateStatistics();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTransactionAdded(transaction: Omit<Transaction, 'id'>) {
    this.transactionService.addTransaction(transaction);
  }

  private updateStatistics() {
    this.totalIncome = this.transactionService.getTotalIncome();
    this.totalExpenses = this.transactionService.getTotalExpenses();
    this.netProfit = this.transactionService.getNetProfit();
  }
}
