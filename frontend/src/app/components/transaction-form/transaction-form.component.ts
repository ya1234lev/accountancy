import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Transaction } from '../../services/transaction.service';
@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transaction-form.component.html',
  styleUrls: ['./transaction-form.component.css']
})
export class TransactionFormComponent {
  showForm = false;

  errorMessage: string = '';
  // ...existing code...
  
  onDueDateChange(): void {
    this.errorMessage = '';
    
    if (this.paymentDetails.dueDate && this.newTransaction.date) {
      const due = new Date(this.paymentDetails.dueDate);
      const tx = new Date(this.newTransaction.date);
      if (due <= tx) {
        this.errorMessage = 'תאריך הפירעון חייב להיות מאוחר מתאריך העסקה';
      }
    }
  }
  @Output() transactionAdded = new EventEmitter<Omit<Transaction, 'id'>>();

  customers = ['לקוח א', 'לקוח ב', 'לקוח ג'];
  suppliers = ['ספק א', 'ספק ב', 'ספק ג'];
  categories = ['משכורות', 'ריהוט', 'ניקיון', 'קופה קטנה', 'תחזוקה'];

  paymentMethod: string = 'cash';
  paymentDetails: any = {};

  newTransaction: any = {
    date: '',
    description: '',
    amount: 0,
    type: 'income',
    category: '',
    client: '',
    supplier: '',
    VAT: 0,
    PaymentMethod: ''
  };

  onSubmit(): void {
    // בדיקה בסיסית
    
    if (!this.newTransaction.date || !this.paymentDetails.amount) {
      console.log("ccc");
      this.errorMessage = 'יש למלא את כל השדות החובה';
      return;
    }
    if (this.newTransaction.type === 'income') {
      if (!this.newTransaction.client) {
        this.errorMessage = 'יש לבחור לקוח';
        return;
      }
      const tx = {
        ...this.newTransaction,
        ...this.paymentDetails,
        supplier: undefined, // לא רלוונטי להכנסה
        category: undefined  // לא רלוונטי להכנסה
      };

      this.transactionAdded.emit(tx);
      this.resetForm();
    } else if (this.newTransaction.type === 'expense') {
      console.log("this.newTransaction",this.newTransaction);
      
      if (!this.newTransaction.supplier) {
        this.errorMessage = 'יש לבחור ספק';
        return;
      }
      if (!this.newTransaction.category) {
        this.errorMessage = 'יש לבחור קטגוריה';
        return;
      }
      const tx = {
        ...this.newTransaction,
        ...this.paymentDetails,
        client: undefined // לא רלוונטי להוצאה
      };
      this.transactionAdded.emit(tx);
      this.resetForm();
    }
  }

  private resetForm(): void {
    this.newTransaction = {
      date: '',
      description: '',
      amount: 0,
      type: 'income',
      category: '',
      client: '',
      supplier: '',
      VAT: 0,
      PaymentMethod: ''
    };
    this.paymentMethod = 'cash';
    this.paymentDetails = {};
    this.errorMessage = '';
  }
}
