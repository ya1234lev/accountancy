import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { TransactionService, ExpenseTransaction,IncomeTransaction } from '../../services/transaction.service';

@Component({
  selector: 'app-transactions-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transactions-table.component.html',
  styleUrls: ['./transactions-table.component.css']
})
export class TransactionsTableComponent implements OnInit, OnDestroy {
  transactions: any[] = [];
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  private destroy$ = new Subject<void>();

  constructor(private transactionService: TransactionService) {}

  ngOnInit() {
    this.transactionService.transactions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(transactions => {
        this.transactions = this.getSorted(transactions);
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
  }

  getSorted(transactions: any[]): any[] {
    if (!this.sortColumn) return [...transactions];
    return [...transactions].sort((a, b) => {
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
