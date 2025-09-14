import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, map, catchError, of, tap, forkJoin } from 'rxjs';
import { ExpenseService, Expense } from './expense.services';
import { IncomeService, Income, Client } from './income.service';
import { SupplierService, Supplier } from './suppliers';

export interface CombinedTransaction {
    id: string;
    type: 'income' | 'expense';
    date: string;
    amount: number;
    description: string;
    category?: string;
    paymentMethod?: string;
    details?: string;
    vatAmount?: number;
    totalAmount?: number;
    clientName?: string; // עבור הכנסות
    supplierName?: string; // עבור הוצאות
    originalData?: any;
}

export interface NotificationMessage {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info' | 'confirm';
    message: string;
    timestamp: Date;
    duration?: number;
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

@Injectable({
    providedIn: 'root'
})
export class CombinedTransactionService {
    private transactionsSubject = new BehaviorSubject<CombinedTransaction[]>([]);
    private notificationsSubject = new BehaviorSubject<NotificationMessage[]>([]);
    private loadingSubject = new BehaviorSubject<boolean>(false);
    
    // Cache for clients and suppliers to avoid repeated API calls
    private clientsCache = new Map<string, any>();
    private suppliersCache = new Map<string, any>();
    private cacheTimestamp: number = 0;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    public transactions$ = this.transactionsSubject.asObservable();
    public notifications$ = this.notificationsSubject.asObservable();
    public loading$ = this.loadingSubject.asObservable();

    constructor(
        private expenseService: ExpenseService,
        private incomeService: IncomeService,
        private supplierService: SupplierService
    ) {
        this.loadTransactions();
    }

    public loadTransactions(): void {
        this.loadingSubject.next(true);

        // בדיקה אם יש cache תקף
        const now = Date.now();
        const needsRefresh = now - this.cacheTimestamp > this.CACHE_DURATION;

        const clientsRequest = needsRefresh || this.clientsCache.size === 0 
            ? this.incomeService.getClients().pipe(
                tap((clients: any[]) => {
                    this.clientsCache.clear();
                    clients.forEach(client => this.clientsCache.set(client.id, client));
                }),
                catchError(() => of([]))
              )
            : of(Array.from(this.clientsCache.values()));

        const suppliersRequest = needsRefresh || this.suppliersCache.size === 0
            ? this.supplierService.getSuppliers().pipe(
                tap((suppliers: any[]) => {
                    this.suppliersCache.clear();
                    suppliers.forEach(supplier => this.suppliersCache.set(supplier.id, supplier));
                }),
                catchError(() => of([]))
              )
            : of(Array.from(this.suppliersCache.values()));

        if (needsRefresh) {
            this.cacheTimestamp = now;
        }

        // טוען הכנסות, הוצאות, לקוחות וספקים במקביל
        forkJoin({
            incomes: this.incomeService.getIncomes().pipe(catchError(() => of([]))),
            expenses: this.expenseService.getExpenses().pipe(catchError(() => of([]))),
            clients: clientsRequest,
            suppliers: suppliersRequest
        }).pipe(
            map(({ incomes, expenses, clients, suppliers }: { incomes: any[], expenses: any[], clients: any[], suppliers: any[] }) => {
                const transactions: CombinedTransaction[] = [];

                // טיפול במקרה שהנתונים מגיעים מה-cache
                const clientsArray = Array.isArray(clients) ? clients : Array.from(this.clientsCache.values());
                const suppliersArray = Array.isArray(suppliers) ? suppliers : Array.from(this.suppliersCache.values());

                // יצירת מפה של לקוחות לפי ID לחיפוש מהיר
                const clientsMap = new Map<string, any>();
                clientsArray.forEach((client: any) => {
                    clientsMap.set(client.id, client);
                });

                // יצירת מפה של ספקים לפי ID לחיפוש מהיר
                const suppliersMap = new Map<string, any>();
                suppliersArray.forEach((supplier: any) => {
                    suppliersMap.set(supplier.id, supplier);
                });

                // עיבוד הכנסות עם batching - ווידוא שהנתונים קיימים
                if (incomes && Array.isArray(incomes) && incomes.length > 0) {
                    this.processBatch(incomes, (income: any) => {
                        const clientName = this.getClientName(income.customer || income.clientId, clientsMap);
                        return {
                            id: income._id || income.id || income.receiptNumber,
                            type: 'income' as const,
                            date: income.date,
                            amount: income.amount,
                            description: `קבלה מספר ${income.receiptNumber}`,
                            category: '',
                            clientName: clientName,
                            paymentMethod: this.getPaymentMethodLabel(income.payment?.method || income.paymentMethod || ''),
                            details: income.details,
                            vatAmount: income.vat || income.vatAmount || 0,
                            totalAmount: income.amount + (income.vat || income.vatAmount || 0),
                            originalData: income
                        };
                    }, transactions);
                }

                // עיבוד הוצאות עם batching - ווידוא שהנתונים קיימים
                if (expenses && Array.isArray(expenses) && expenses.length > 0) {
                    this.processBatch(expenses, (expense: any) => {
                        const supplierName = this.getSupplierName(expense.supplier || expense.supplierId, suppliersMap);
                        return {
                            id: expense._id || expense.id,
                            type: 'expense' as const,
                            date: expense.date,
                            amount: expense.amount,
                            description: `הוצאה - ${expense.referenceNumber || expense.id}`,
                            category: expense.category || 'הוצאה',
                            paymentMethod: this.getPaymentMethodLabel(expense.paymentMethod),
                            supplierName: supplierName,
                            details: expense.details,
                            vatAmount: expense.vat || expense.vatAmount || 0,
                            totalAmount: expense.totalAmount || expense.amount,
                            originalData: expense
                        };
                    }, transactions);
                }

                return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            }),
            tap((transactions: CombinedTransaction[]) => {
                this.transactionsSubject.next(transactions);
                this.loadingSubject.next(false);
                this.removeNotification('loading');
            })
        ).subscribe({
            error: (error) => {
                console.error('שגיאה בטעינת עסקאות:', error);
                this.loadingSubject.next(false);
                this.removeNotification('loading');
                this.transactionsSubject.next([]);
            }
        });
    }

    private getPaymentMethodLabel(method: string): string {
        const labels: { [key: string]: string } = {
            'cash': 'מזומן',
            'credit': 'אשראי',
            'check': "צ'ק",
            'bank_transfer': 'העברה בנקאית',
            'transfer': 'העברה בנקאית'
        };
        return labels[method] || method || 'לא מוגדר';
    }

    // פונקציה עזר לחיפוש לקוח לפי מזהה
    private getClientName(clientId: string, clientsMap: Map<string, any>): string {
        const client = clientsMap.get(clientId.toString());
        return client ? client.name : `לקוח לא נמצא (${clientId})`;
    }

    // פונקציה עזר לחיפוש ספק לפי מזהה
    private getSupplierName(supplierId: string, suppliersMap: Map<string, any>): string {
        const supplier = suppliersMap.get(supplierId.toString());
        return supplier ? supplier.name : `ספק לא נמצא (${supplierId})`;
    }

    // עיבוד נתונים בחבילות לשיפור ביצועים
    private processBatch<T>(items: T[], processor: (item: T) => CombinedTransaction, results: CombinedTransaction[], batchSize: number = 100): void {
        if (!items || !Array.isArray(items) || items.length === 0) {
            return;
        }
        
        if (!processor || typeof processor !== 'function') {
            return;
        }
        
        if (!results || !Array.isArray(results)) {
            return;
        }

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            batch.forEach((item) => {
                try {
                    if (item && typeof item === 'object') {
                        const processedItem = processor(item);
                        if (processedItem) {
                            results.push(processedItem);
                        }
                    }
                } catch (error) {
                    console.warn('שגיאה בעיבוד פריט:', error);
                }
            });
        }
    }

    deleteTransaction(index: number): void {
        const transactions = this.transactionsSubject.value;
        const transaction = transactions[index];

        if (!transaction) {
            this.showNotification('error', 'עסקה לא נמצאה');
            return;
        }

        if (transaction.type === 'income') {
            this.incomeService.deleteIncome(transaction.id).subscribe({
                next: () => {
                    this.loadTransactions();
                    this.showNotification('success', 'הכנסה נמחקה בהצלחה');
                },
                error: (error) => {
                    console.error('שגיאה במחיקת הכנסה:', error);
                    this.showNotification('error', 'שגיאה במחיקת הכנסה');
                }
            });
        } else if (transaction.type === 'expense') {
            this.expenseService.deleteExpense(transaction.id).subscribe({
                next: () => {
                    this.loadTransactions();
                    this.showNotification('success', 'הוצאה נמחקה בהצלחה');
                },
                error: (error) => {
                    console.error('שגיאה במחיקת הוצאה:', error);
                    this.showNotification('error', 'שגיאה במחיקת הוצאה');
                }
            });
        }
    }

    clearAllData(): void {
        this.showNotification('info', 'מוחק את כל הנתונים ...', 0);
        
        // שימוש בנקודות קצה ייעודיות למחיקת כל הנתונים
        forkJoin({
            incomes: this.incomeService.deleteAllIncomes().pipe(
                catchError(error => {
                    console.error('שגיאה במחיקת כל ההכנסות:', error);
                    return of({ deletedCount: 0, error: error.message });
                })
            ),
            expenses: this.expenseService.deleteAllExpenses().pipe(
                catchError(error => {
                    console.error('שגיאה במחיקת כל ההוצאות:', error);
                    return of({ deletedCount: 0, error: error.message });
                })
            )
        }).subscribe({
            next: ({ incomes, expenses }) => {
                this.removeNotification('loading');
                this.loadTransactions(); // רענון הנתונים
                
                const incomesCount = incomes.deletedCount || 0;
                const expensesCount = expenses.deletedCount || 0;
                const totalDeleted = incomesCount + expensesCount;
                
                if (totalDeleted > 0) {
                    this.showNotification('success', 'נמחק בהצלחה');
                } else {
                    this.showNotification('info', 'לא נמצאו עסקאות למחיקה');
                }
                
                // ניקוי ה-cache
                this.clientsCache.clear();
                this.suppliersCache.clear();
                this.cacheTimestamp = 0;
            },
            error: (error) => {
                console.error('שגיאה במחיקת נתונים:', error);
                this.removeNotification('loading');
                this.showNotification('error', 'שגיאה במחיקת נתונים ');
                this.loadTransactions(); // רענון הנתונים גם במקרה של שגיאה
            }
        });
    }

    exportToExcel(): void {
        const transactions = this.transactionsSubject.value;

        if (transactions.length === 0) {
            this.showNotification('warning', 'אין נתונים לייצוא');
            return;
        }

        // יצירת CSV מפורט עם כל הנתונים
        const headers = [
            'תאריך', 'סוג', 'תיאור', 'קטגוריה', 'מע"מ',
            'סה"כ', 'אמצעי תשלום', 'לקוח/ספק'
        ];
        const csvContent = [
            headers.join(','),
            ...transactions.map(t => [
                t.date,
                t.type === 'income' ? 'הכנסה' : 'הוצאה',
                `"${t.description || ''}"`,
                `"${t.category || ''}"`,
                t.vatAmount || 0,
                t.amount,
                `"${t.paymentMethod || ''}"`,
                `"${t.clientName || t.supplierName || ''}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `transactions_detailed_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

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

    public showNotification(type: NotificationMessage['type'], message: string, duration: number = 5000): void {
        const notification: NotificationMessage = {
            id: type === 'info' && message.includes('טוען') ? 'loading' : Date.now().toString(),
            type,
            message,
            timestamp: new Date(),
            duration
        };

        const notifications = this.notificationsSubject.value;
        this.notificationsSubject.next([...notifications, notification]);

        if (duration > 0) {
            setTimeout(() => {
                this.removeNotification(notification.id);
            }, duration);
        }
    }

    public showConfirmation(message: string, onConfirm: () => void, onCancel?: () => void): void {
        const notification: NotificationMessage = {
            id: Date.now().toString(),
            type: 'confirm',
            message,
            timestamp: new Date(),
            duration: 0, // לא נעלם אוטומטית
            onConfirm,
            onCancel,
            confirmText: 'מחק',
            cancelText: 'ביטול'
        };

        const notifications = this.notificationsSubject.value;
        this.notificationsSubject.next([...notifications, notification]);
    }

    removeNotification(id: string): void {
        const notifications = this.notificationsSubject.value.filter(n => n.id !== id);
        this.notificationsSubject.next(notifications);
    }

    refreshTransactions(): void {
        this.loadTransactions();
    }

    // הוספת עסקת הכנסה
    addIncomeTransaction(income: Partial<Income>): void {
        this.incomeService.addIncome(income).subscribe({
            next: () => {
                this.loadTransactions();
                this.showNotification('success', 'הכנסה נוספה בהצלחה');
            },
            error: (error) => {
                console.error('שגיאה בהוספת הכנסה:', error);
                this.showNotification('error', 'שגיאה בהוספת הכנסה');
            }
        });
    }

    // הוספת עסקת הוצאה
    addExpenseTransaction(expense: Partial<Expense>): void {
        this.expenseService.addExpense(expense).subscribe({
            next: () => {
                this.loadTransactions();
                this.showNotification('success', 'הוצאה נוספה בהצלחה');
            },
            error: (error) => {
                console.error('שגיאה בהוספת הוצאה:', error);
                this.showNotification('error', 'שגיאה בהוספת הוצאה');
            }
        });
    }
}
