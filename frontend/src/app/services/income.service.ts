import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
  private incomesSubject = new BehaviorSubject<Income[]>([]);
  private clientsSubject = new BehaviorSubject<Client[]>([]);
  
  public incomes$ = this.incomesSubject.asObservable();
  public clients$ = this.clientsSubject.asObservable();

  constructor() {
    this.loadInitialData();
  }

  private loadInitialData(): void {
    // Load mock clients
    const clients: Client[] = [
      { id: '1', name: 'לקוח ראשון', email: 'client1@example.com', phone: '050-1234567' },
      { id: '2', name: 'לקוח שני', email: 'client2@example.com', phone: '050-2345678' },
      { id: '3', name: 'לקוח שלישי', email: 'client3@example.com', phone: '050-3456789' }
    ];
    this.clientsSubject.next(clients);

    // Load mock incomes
    const incomes: Income[] = [
      {
        id: '1',
        receiptNumber: 'REC-001',
        date: '2024-01-15',
        clientId: '1',
        amount: 1000,
        vatRate: 17,
        vat: 170,
        paymentMethod: 'cash',
        paymentDetails: { amount: 1170 },
        details: 'מכירת מוצר א',
        printDate: '2024-01-15',
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        receiptNumber: 'REC-002',
        date: '2024-01-16',
        clientId: '2',
        amount: 2000,
        vatRate: 17,
        vat: 340,
        paymentMethod: 'credit',
        paymentDetails: { 
          amount: 2340, 
          lastFourDigits: '1234',
          installments: 3
        },
        details: 'שירות ייעוץ',
        printDate: '2024-01-16',
        createdAt: '2024-01-16T14:30:00Z'
      }
    ];
    this.incomesSubject.next(incomes);
  }

  // Income Methods
  getIncomes(): Observable<Income[]> {
    return this.incomes$;
  }

  addIncome(income: Income): void {
    const currentIncomes = this.incomesSubject.value;
    income.id = Date.now().toString();
    income.createdAt = new Date().toISOString();
    income.printDate = new Date().toISOString().split('T')[0];
    
    const updatedIncomes = [...currentIncomes, income];
    this.incomesSubject.next(updatedIncomes);
  }

  updateIncome(income: Income): void {
    const currentIncomes = this.incomesSubject.value;
    const index = currentIncomes.findIndex(i => i.id === income.id);
    
    if (index !== -1) {
      income.updatedAt = new Date().toISOString();
      currentIncomes[index] = income;
      this.incomesSubject.next([...currentIncomes]);
    }
  }

  deleteIncome(incomeId: string): void {
    const currentIncomes = this.incomesSubject.value;
    const filteredIncomes = currentIncomes.filter(i => i.id !== incomeId);
    this.incomesSubject.next(filteredIncomes);
  }

  generateReceiptNumber(): string {
    const currentIncomes = this.incomesSubject.value;
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const lastNumber = currentIncomes.length + 1;
    return `REC-${year}${month}-${lastNumber.toString().padStart(3, '0')}`;
  }

  // Client Methods
  getClients(): Observable<Client[]> {
    return this.clients$;
  }

  addClient(client: Client): void {
    const currentClients = this.clientsSubject.value;
    client.id = Date.now().toString();
    
    const updatedClients = [...currentClients, client];
    this.clientsSubject.next(updatedClients);
  }

  updateClient(client: Client): void {
    const currentClients = this.clientsSubject.value;
    const index = currentClients.findIndex(c => c.id === client.id);
    
    if (index !== -1) {
      currentClients[index] = client;
      this.clientsSubject.next([...currentClients]);
    }
  }

  deleteClient(clientId: string): void {
    const currentClients = this.clientsSubject.value;
    const filteredClients = currentClients.filter(c => c.id !== clientId);
    this.clientsSubject.next(filteredClients);
  }

  getClientById(clientId: string): Client | undefined {
    const clients = this.clientsSubject.value;
    return clients.find(c => c.id === clientId);
  }

  // Helper Methods
  calculateVAT(amount: number, vatRate: number): number {
    return Math.round((amount * vatRate / 100) * 100) / 100;
  }

  getPaymentMethodLabel(method: string): string {
    const labels: { [key: string]: string } = {
      'cash': 'מזומן',
      'credit': 'אשראי',
      'check': 'צ\'ק',
      'bank_transfer': 'העברה בנקאית'
    };
    return labels[method] || method;
  }

  // Statistics
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
