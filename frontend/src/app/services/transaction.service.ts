import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as XLSX from 'xlsx';

export interface Transaction {
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  client: string;
  id?: string;
}

export interface NotificationMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private transactionsSubject = new BehaviorSubject<Transaction[]>([]);
  public transactions$ = this.transactionsSubject.asObservable();

  private notificationsSubject = new BehaviorSubject<NotificationMessage[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor() {
    this.loadSavedData();
  }

  // Transaction methods
  getTransactions(): Transaction[] {
    return this.transactionsSubject.value;
  }

  addTransaction(transaction: Omit<Transaction, 'id'>): boolean {
    const newTransaction = {
      ...transaction,
      id: this.generateId()
    };

    if (!this.isDuplicate(newTransaction)) {
      const currentTransactions = this.transactionsSubject.value;
      const updatedTransactions = [...currentTransactions, newTransaction];
      this.transactionsSubject.next(updatedTransactions);
      this.saveData();
      this.showNotification('העסקה נוספה בהצלחה!', 'success');
      return true;
    } else {
      this.showNotification('עסקה זהה כבר קיימת במערכת', 'error');
      return false;
    }
  }

  deleteTransaction(index: number): void {
    const currentTransactions = this.transactionsSubject.value;
    currentTransactions.splice(index, 1);
    this.transactionsSubject.next([...currentTransactions]);
    this.saveData();
  }

  clearAllData(): void {
    this.transactionsSubject.next([]);
    this.saveData();
    this.showNotification('כל הנתונים נמחקו בהצלחה', 'success');
  }

  addTransactionsFromFile(transactions: Transaction[]): void {
    const currentTransactions = this.transactionsSubject.value;
    let addedCount = 0;

    transactions.forEach(transaction => {
      if (!this.isDuplicate(transaction)) {
        currentTransactions.push(transaction);
        addedCount++;
      }
    });

    this.transactionsSubject.next([...currentTransactions]);
    this.saveData();
    
    if (addedCount > 0) {
      this.showNotification(`נוספו ${addedCount} עסקאות חדשות`, 'success');
    }
  }

  // Statistics methods
  getTotalIncome(): number {
    return this.transactionsSubject.value
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getTotalExpenses(): number {
    return this.transactionsSubject.value
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  getNetProfit(): number {
    return this.getTotalIncome() - this.getTotalExpenses();
  }

  // Export methods
  exportToExcel(): void {
    const transactions = this.transactionsSubject.value;
    if (transactions.length === 0) {
      this.showNotification('אין עסקאות לייצוא', 'error');
      return;
    }

    const workbook = XLSX.utils.book_new();
    const excelData = [
      ['תאריך', 'תיאור', 'סכום', 'סוג', 'לקוח'],
      ...transactions.map(t => [
        t.date,
        t.description,
        t.amount,
        t.type === 'income' ? 'הכנסה' : 'הוצאה',
        t.client
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(excelData);
    const columnWidths = [
      { width: 12 }, { width: 30 }, { width: 15 }, { width: 10 }, { width: 20 }
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'עסקאות');
    const fileName = `transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    this.showNotification(`הקובץ ${fileName} יוצא בהצלחה!`, 'success');
  }

  // Notification methods
  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    const notification: NotificationMessage = { id, message, type, visible: true };
    
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, notification]);
    
    setTimeout(() => {
      this.removeNotification(id);
    }, 4000);
  }

  removeNotification(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const index = currentNotifications.findIndex(n => n.id === id);
    if (index > -1) {
      currentNotifications[index].visible = false;
      this.notificationsSubject.next([...currentNotifications]);
      
      setTimeout(() => {
        const updatedNotifications = this.notificationsSubject.value.filter(n => n.id !== id);
        this.notificationsSubject.next(updatedNotifications);
      }, 300);
    }
  }

  // Private methods
  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private isDuplicate(newTransaction: Transaction): boolean {
    return this.transactionsSubject.value.some(t => 
      t.date === newTransaction.date &&
      t.description === newTransaction.description &&
      t.amount === newTransaction.amount &&
      t.client === newTransaction.client
    );
  }

  private saveData(): void {
    localStorage.setItem('bookkeeping_transactions', JSON.stringify(this.transactionsSubject.value));
  }

  private loadSavedData(): void {
    const saved = localStorage.getItem('bookkeeping_transactions');
    if (saved) {
      try {
        const transactions = JSON.parse(saved);
        this.transactionsSubject.next(transactions);
      } catch (error) {
        console.error('שגיאה בטעינת נתונים:', error);
      }
    }
  }
}
