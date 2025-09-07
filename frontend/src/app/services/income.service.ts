import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface PaymentDetails {
  amount?: number;
  lastFourDigits?: string;
  installments?: number;
  checkNumber?: string;
  accountNumber?: string;
  bankNumber?: string;
  dueDate?: string;
  transferNumber?: string;
  transferDate?: string;
}

export interface Income {
  id?: string;
  receiptNumber: string;
  date: string;
  clientId: string;
  amount: number;
  vatRate: number;
  vat: number;
  paymentMethod: 'cash' | 'credit' | 'check' | 'bank_transfer' | '';
  paymentDetails: PaymentDetails;
  details: string;
  printDate?: string;
  createdAt?: string;
  updatedAt?: string;
}


@Injectable({
  providedIn: 'root'
})
export class IncomeService {
  private apiUrl = 'http://localhost:3000/api/incomes';
  private clientsUrl = 'http://localhost:3000/api/customers';

  constructor(private http: HttpClient) {}

  // Income Methods
  getIncomes(): Observable<Income[]> {
    return this.http.get<{data: Income[]}>(this.apiUrl).pipe(
      map(response => response.data)
    );
  }

  addIncome(income: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, income);
  }

  updateIncome(income: Income): Observable<Income> {
    return this.http.put<Income>(`${this.apiUrl}/${income.id}`, income);
  }

  deleteIncome(incomeId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${incomeId}`);
  }

  generateReceiptNumber(): Observable<{ receiptNumber: string }> {
    return this.http.get<{ receiptNumber: string }>(`${this.apiUrl}/generate-receipt-number`);
  }

  // Client Methods
  getClients(): Observable<Client[]> {
    return this.http.get<Client[]>(this.clientsUrl);
  }

  addClient(client: Client): Observable<Client> {
    return this.http.post<Client>(this.clientsUrl, client);
  }

  updateClient(client: Client): Observable<Client> {
    return this.http.put<Client>(`${this.clientsUrl}/${client.id}`, client);
  }

  deleteClient(clientId: string): Observable<any> {
    return this.http.delete(`${this.clientsUrl}/${clientId}`);
  }

  getClientById(clientId: string): Observable<Client> {
    return this.http.get<Client>(`${this.clientsUrl}/${clientId}`);
  }

  // Helper Methods (ניתן להשאיר חישובים לוגיים בצד הקליינט במידת הצורך)
  calculateVAT(amount: number, vatRate: number): number {
    return Math.round((amount * vatRate / 100) * 100) / 100;
  }

  getPaymentMethodLabel(method: string): string {
    const labels: { [key: string]: string } = {
      'cash': 'מזומן',
      'credit': 'אשראי',
      'check': "צ'ק",
      'bank_transfer': 'העברה בנקאית'
    };
    return labels[method] || method;
  }

  // סטטיסטיקות וכד' - יש לבצע על הנתונים שמתקבלים מהשרת
  getTotalIncome(incomes: Income[]): number {
    return incomes.reduce((sum, income) => sum + income.amount, 0);
  }

  getTotalVAT(incomes: Income[]): number {
    return incomes.reduce((sum, income) => sum + income.vat, 0);
  }

  getIncomesByDateRange(incomes: Income[], fromDate: string, toDate: string): Income[] {
    return incomes.filter(income => 
      income.date >= fromDate && income.date <= toDate
    );
  }

  getIncomesByClient(incomes: Income[], clientId: string): Income[] {
    return incomes.filter(income => income.clientId === clientId);
  }

  getIncomesByPaymentMethod(incomes: Income[], paymentMethod: string): Income[] {
    return incomes.filter(income => income.paymentMethod === paymentMethod);
  }
}
