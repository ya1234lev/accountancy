import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Expense {
    id: string;
    referenceNumber?: string;
    date: string;
    supplierId: string;
    supplierName: string;
    category?: string;
    amount: number;
    vatRate: number;
    vatAmount: number;
    totalAmount: number;
    paymentMethod: 'cash' | 'credit' | 'check' | 'transfer';
    details: string;
    printDate: string;
    // אפשר להוסיף שדות נוספים לפי הצורך
}

@Injectable({
    providedIn: 'root'
})
export class ExpenseService {
    private apiUrl = `${environment.apiUrl}/expenses`; // עדכן לכתובת הנכונה ב-backend שלך

    constructor(private http: HttpClient) { }

    getExpenses(): Observable<Expense[]> {
        return this.http.get<{data: Expense[]}>(this.apiUrl).pipe(
            map(response => response.data)
        );
    }

    getExpense(id: string): Observable<Expense> {
        return this.http.get<Expense>(`${this.apiUrl}/${id}`);
    }

    addExpense(expense: Partial<Expense>): Observable<Expense> {
        return this.http.post<Expense>(this.apiUrl, expense);
    }

    updateExpense(id: string, expense: Partial<Expense>): Observable<Expense> {
        return this.http.put<Expense>(`${this.apiUrl}/${id}`, expense);
    }

    deleteExpense(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${id}`);
    }

    // מחיקת כל ההוצאות
    deleteAllExpenses(): Observable<any> {
        return this.http.delete(this.apiUrl);
    }

    // העלאת קבצי PDF מרובים ויצירת הוצאות אוטומטית
    uploadMultiplePdfs(formData: FormData): Promise<any> {
        return this.http.post<any>(`${this.apiUrl}/upload-multiple-pdfs`, formData).toPromise();
    }
}