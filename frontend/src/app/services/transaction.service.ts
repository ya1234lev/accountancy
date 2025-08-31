import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  // URL של השרת
  private baseUrl = 'http://localhost:3001/api';

  constructor(private http: HttpClient) {
    this.loadSavedData();
    this.testServerConnection();
  }

  // בדיקת חיבור לשרת
  private testServerConnection(): void {
    this.http.get('http://localhost:3001').subscribe({
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

  addTransaction(transaction: Omit<Transaction, 'id'>, showNotification: boolean = true): boolean {
    const newTransaction = {
      ...transaction,
      id: this.generateId()
    };

    if (!this.isDuplicate(newTransaction)) {
      const currentTransactions = this.transactionsSubject.value;
      const updatedTransactions = [...currentTransactions, newTransaction];
      this.transactionsSubject.next(updatedTransactions);
      this.saveData();
      if (showNotification) {
        this.showNotification('העסקה נוספה בהצלחה!', 'success');
      }
      return true;
    } else {
      if (showNotification) {
        this.showNotification('עסקה זהה כבר קיימת במערכת', 'error');
      }
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
      const newTransaction = {
        ...transaction,
        id: this.generateId()
      };
      
      // בדיקת כפילות מול הרשימה הנוכחית (כולל מה שכבר נוסף)
      if (!this.isDuplicate(newTransaction, newTransactions)) {
        newTransactions.push(newTransaction);
        addedCount++;
      } else {
        duplicateCount++;
      }
    });

    // עדכון הנתונים פעם אחת בלבד
    this.transactionsSubject.next(newTransactions);
    this.saveData();
    
    // הצגת התראה אחת עם סיכום
    if (addedCount > 0 && duplicateCount > 0) {
      this.showNotification(`נוספו ${addedCount} עסקאות חדשות, ${duplicateCount} עסקאות כפולות לא נוספו`, 'success');
    } else if (addedCount > 0) {
      this.showNotification(`נוספו ${addedCount} עסקאות חדשות !`, 'success');
    } else if (duplicateCount > 0) {
      this.showNotification(`כל ${duplicateCount} העסקאות כבר קיימות במערכת`, 'info');
    } else {
      this.showNotification('לא נמצאו עסקאות תקינות לייבוא', 'error');
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

  private isDuplicate(newTransaction: Transaction, existingTransactions?: Transaction[]): boolean {
    const transactionsToCheck = existingTransactions || this.transactionsSubject.value;
    return transactionsToCheck.some(t => 
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
