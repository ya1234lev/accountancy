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
  @Output() transactionAdded = new EventEmitter<Omit<Transaction, 'id'>>();

  customers = ['לקוח א', 'לקוח ב', 'לקוח ג'];
  suppliers = ['ספק א', 'ספק ב', 'ספק ג'];
  categories = ['משכורות', 'ריהוט', 'ניקיון', 'קופה קטנה', 'תחזוקה'];

  paymentMethod: string = 'cash';
  paymentDetails: any = {};

  newTransaction: Omit<Transaction, 'id'> = {
    date: '',
    description: '',
    amount: 0,
    type: 'income',
    category: '',
    client: ''
  };

  onSubmit(): void {
    if (this.newTransaction.date && this.newTransaction.amount && this.newTransaction.client) {
      // אפשר להוסיף כאן שילוב של paymentDetails ב-newTransaction לפי הצורך
      this.transactionAdded.emit({ ...this.newTransaction });
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
      client: ''
    };
    this.paymentMethod = 'cash';
    this.paymentDetails = {};
  }
}
