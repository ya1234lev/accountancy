import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { CombinedTransactionService, CombinedTransaction } from '../../services/combined-transaction.service';

@Component({
  selector: 'app-transactions-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transactions-table.component.html',
  styleUrls: ['./transactions-table.component.css']
})
export class TransactionsTableComponent implements OnInit, OnDestroy {
  transactions: CombinedTransaction[] = [];
  displayedTransactions: CombinedTransaction[] = [];
  isLoading: boolean = false;
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  currentDisplayCount: number = 10;
  readonly INITIAL_DISPLAY_COUNT = 10;
  readonly INCREMENT_COUNT = 10;
  readonly Math = Math; // For template access
  private destroy$ = new Subject<void>();

  constructor(private transactionService: CombinedTransactionService) {}

  ngOnInit() {
    // האזנה לטעינת נתונים
    this.transactionService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });

    // האזנה לעסקאות
    this.transactionService.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe((transactions: CombinedTransaction[]) => {
        this.transactions = this.getSorted(transactions);
        this.updateDisplayedTransactions();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.transactions = this.getSorted(this.transactions);
    this.updateDisplayedTransactions();
  }

  updateDisplayedTransactions() {
    this.displayedTransactions = this.transactions.slice(0, this.currentDisplayCount);
  }

  loadMore() {
    this.currentDisplayCount += this.INCREMENT_COUNT;
    this.updateDisplayedTransactions();
  }

  showLess() {
    this.currentDisplayCount = this.INITIAL_DISPLAY_COUNT;
    this.updateDisplayedTransactions();
  }

  get hasMoreToShow(): boolean {
    return this.displayedTransactions.length < this.transactions.length;
  }

  get canShowLess(): boolean {
    return this.currentDisplayCount > this.INITIAL_DISPLAY_COUNT;
  }

  getSorted(transactions: CombinedTransaction[]): CombinedTransaction[] {
    let sorted: CombinedTransaction[];
    if (!this.sortColumn) {
      sorted = [...transactions];
    } else {
      sorted = [...transactions].sort((a, b) => {
        let aVal = (a as any)[this.sortColumn];
        let bVal = (b as any)[this.sortColumn];
        if (this.sortColumn === 'amount') {
          aVal = Number(aVal);
          bVal = Number(bVal);
        }
        if (this.sortColumn === 'date') {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }
        if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    // Reset display count when sorting
    this.currentDisplayCount = this.INITIAL_DISPLAY_COUNT;
    // Update displayed transactions whenever we sort
    setTimeout(() => this.updateDisplayedTransactions(), 0);
    return sorted;
  }

  deleteTransaction(displayedIndex: number) {
    // Find the actual index in the original transactions array
    const transaction = this.displayedTransactions[displayedIndex];
    const actualIndex = this.transactions.findIndex(t => 
      t.date === transaction.date && 
      t.amount === transaction.amount && 
      t.description === transaction.description &&
      t.type === transaction.type
    );
    
    if (actualIndex !== -1) {
      this.transactionService.deleteTransaction(actualIndex);
    }
  }

  clearAllData() {
    if (confirm('האם אתה בטוח שברצונך למחוק את כל הנתונים?')) {
      this.transactionService.clearAllData();
    }
  }

  exportToExcel() {
    this.transactionService.exportToExcel();
  }

  refreshData() {
    this.transactionService.refreshTransactions();
  }
}
