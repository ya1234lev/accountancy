import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Transaction } from '../../services/transaction.service';

@Component({
  selector: 'app-transaction-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="card">
      <div class="card-header">
        <h3 class="card-title">
          <svg class="card-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z"/>
          </svg>
          הוספת עסקה חדשה
        </h3>
      </div>
      <div class="card-body">
        <form (ngSubmit)="onSubmit()" class="form">
          <div class="form-group">
            <label for="date" class="form-label">תאריך עסקה</label>
            <input 
              id="date"
              type="date" 
              [(ngModel)]="newTransaction.date" 
              name="date" 
              required 
              class="form-input">
          </div>
          
          <div class="form-group">
            <label for="description" class="form-label">תיאור העסקה</label>
            <input 
              id="description"
              type="text" 
              [(ngModel)]="newTransaction.description" 
              name="description" 
              required 
              placeholder="הזן תיאור מפורט של העסקה"
              class="form-input">
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="amount" class="form-label">סכום (₪)</label>
              <input 
                id="amount"
                type="number" 
                [(ngModel)]="newTransaction.amount" 
                name="amount" 
                required 
                step="0.01"
                min="0"
                placeholder="0.00"
                class="form-input">
            </div>
            
            <div class="form-group">
              <label for="type" class="form-label">סוג העסקה</label>
              <select 
                id="type"
                [(ngModel)]="newTransaction.type" 
                name="type" 
                required
                class="form-select">
                <option value="">בחר סוג עסקה</option>
                <option value="income">הכנסה</option>
                <option value="expense">הוצאה</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="client" class="form-label">לקוח/ספק</label>
              <input 
                id="client"
                type="text" 
                [(ngModel)]="newTransaction.client" 
                name="client" 
                required 
                placeholder="שם הלקוח או הספק"
                class="form-input">
            </div>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn btn--primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17,9H7V7H17M17,13H7V11H17M14,17H7V15H14M12,3A1,1 0 0,1 13,4A1,1 0 0,1 12,5A1,1 0 0,1 11,4A1,1 0 0,1 12,3M19,3H14.82C14.4,1.84 13.3,1 12,1C10.7,1 9.6,1.84 9.18,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V5A2,2 0 0,0 19,3Z"/>
              </svg>
              שמור עסקה
            </button>
          </div>
        </form>
      </div>
    </section>
  `,
  styles: [`
    .card {
      background: var(--white);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-lg);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .card-header {
      background: var(--gray-50);
      border-bottom: 1px solid var(--border-color);
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--gray-900);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .card-icon {
      color: var(--gray-500);
    }

    .card-body {
      padding: 1.5rem;
    }

    .form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--gray-700);
    }

    .form-input,
    .form-select {
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      font-size: 0.875rem;
      transition: var(--transition);
      background: var(--white);
    }

    .form-input:focus,
    .form-select:focus {
      outline: none;
      border-color: var(--accent-color);
      box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
    }

    .form-input::placeholder {
      color: var(--gray-400);
    }

    .form-actions {
      margin-top: 0.5rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid transparent;
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: var(--transition);
      text-decoration: none;
      white-space: nowrap;
      user-select: none;
    }

    .btn:active {
      transform: translateY(1px);
    }

    .btn--primary {
      background: var(--primary-color);
      border-color: var(--primary-color);
      color: var(--white);
    }

    .btn--primary:hover {
      background: var(--dark-blue);
      border-color: var(--dark-blue);
    }

    .btn--primary:focus {
      outline: none;
      background: var(--dark-blue);
      border-color: var(--dark-blue);
      box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.2);
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }

      .btn {
        font-size: 0.75rem;
        padding: 0.625rem 1rem;
      }
    }
  `]
})
export class TransactionFormComponent {
  @Output() transactionAdded = new EventEmitter<Omit<Transaction, 'id'>>();

  newTransaction: Omit<Transaction, 'id'> = {
    date: '',
    description: '',
    amount: 0,
    type: 'income',
    category: '',
    client: ''
  };

  onSubmit(): void {
    if (this.newTransaction.date && this.newTransaction.description && 
        this.newTransaction.amount && this.newTransaction.client) {
      
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
  }
}
