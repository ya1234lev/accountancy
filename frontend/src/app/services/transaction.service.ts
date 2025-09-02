// Transaction type for union of income/expense
export type Transaction = (IncomeTransaction & { type: 'income' }) | (ExpenseTransaction & { type: 'expense' });
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import * as XLSX from 'xlsx';

export interface IncomeTransaction {
  transactionID: Number;
  date: string;
  client: string;
  amount: number;
  VAT: Number;
  PaymentMethod: string;
  description: string;
}
export interface ExpenseTransaction {
  transactionID: Number;
  date: string;
  supplier: string;
  category: string;
  amount: number;
  description: string;
  VAT: Number;
  PaymentMethod: string;

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

  // URL של השרת
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {
    this.loadSavedData();
    this.testServerConnection();
  }

  // בדיקת חיבור לשרת
  private testServerConnection(): void {
    this.http.get('http://localhost:3000').subscribe({
      next: (response) => {
        console.log('חיבור לשרת הצליח:', response);
      },
      error: (error) => {
        console.error('שגיאה בחיבור לשרת:', error);
      }
    });
  }

  // API Methods - חיבור לשרת
  
  // קבלת לקוחות מהשרת
  getCustomers(): Observable<any> {
    return this.http.get(`${this.baseUrl}/customers`);
  }

  // יצירת לקוח חדש
  createCustomer(customerData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/customers`, customerData);
  }

  // קבלת הכנסות מהשרת
  getIncomes(): Observable<any> {
    return this.http.get(`${this.baseUrl}/income`);
  }

  // יצירת הכנסה חדשה
  createIncome(incomeData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/income`, incomeData);
  }

  // קבלת הוצאות מהשרת
  getExpenses(): Observable<any> {
    return this.http.get(`${this.baseUrl}/expenses`);
  }

  // יצירת הוצאה חדשה
  createExpense(expenseData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/expenses`, expenseData);
  }

  // Transaction methods
  getTransactions(): Transaction[] {
    return this.transactionsSubject.value;
  }

  addIncomeTransaction(transaction: Omit<IncomeTransaction, 'transactionID'>): boolean {
    const newTransaction: Transaction = {
      ...transaction,
      transactionID: Number(this.generateId()),
      type: 'income'
    };
    if (!this.isDuplicate(newTransaction)) {
      const currentTransactions = this.transactionsSubject.value;
      const updatedTransactions = [...currentTransactions, newTransaction];
      this.transactionsSubject.next(updatedTransactions);
      this.saveData();
      this.showNotification('הכנסה נוספה בהצלחה!', 'success');
      return true;
    } else {
      this.showNotification('הכנסה זהה כבר קיימת במערכת', 'error');
      return false;
    }
  }

  addExpenseTransaction(transaction: Omit<ExpenseTransaction, 'transactionID'>): boolean {
    const newTransaction: Transaction = {
      ...transaction,
      transactionID: Number(this.generateId()),
      type: 'expense'
    };
    if (!this.isDuplicate(newTransaction)) {
      const currentTransactions = this.transactionsSubject.value;
      const updatedTransactions = [...currentTransactions, newTransaction];
      this.transactionsSubject.next(updatedTransactions);
      this.saveData();
      this.showNotification('הוצאה נוספה בהצלחה!', 'success');
      return true;
    } else {
      this.showNotification('הוצאה זהה כבר קיימת במערכת', 'error');
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
    let duplicateCount = 0;
    const newTransactions = [...currentTransactions];

    transactions.forEach(transaction => {
      if (!this.isDuplicate(transaction)) {
        currentTransactions.push(transaction);
        addedCount++;
      } else {
        duplicateCount++;
      }
    });

    // עדכון הנתונים פעם אחת בלבד
    this.transactionsSubject.next(newTransactions);
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
      ['תאריך', 'תיאור', 'סכום', 'סוג', 'לקוח/ספק'],
      ...transactions.map(t => [
        t.date,
        t.description,
        t.amount,
        t.type === 'income' ? 'הכנסה' : 'הוצאה',
        t.type === 'income' ? (t as any).client : (t as any).supplier
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
    this.showNotification(`הקובץ ${fileName} יוצא !`, 'success');
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

  private isDuplicate(newTransaction: any): boolean {
    // בדיקת כפילות לפי סוג טרנזקציה
    if (newTransaction.type === 'income') {
      return this.transactionsSubject.value.some(t =>
        t.type === 'income' &&
        t.date === newTransaction.date &&
        t.client === newTransaction.client &&
        t.amount === newTransaction.amount &&
        t.description === newTransaction.description
      );
    } else if (newTransaction.type === 'expense') {
      return this.transactionsSubject.value.some(t =>
        t.type === 'expense' &&
        t.date === newTransaction.date &&
        t.supplier === newTransaction.supplier &&
        t.amount === newTransaction.amount &&
        t.category === newTransaction.category
      );
    }
    return false;
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
