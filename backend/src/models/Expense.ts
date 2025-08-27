import { Schema, model, Document, Types } from 'mongoose';

export interface IExpense extends Document {
  referenceNumber: string;
  date: Date;
  supplier: Types.ObjectId;
  category: 'salaries' | 'furniture' | 'cleaning' | 'petty_cash' | 'maintenance';
  amount: number;
  vat: number;
  paymentMethod: 'cash' | 'credit' | 'check' | 'transfer';
  attachment?: string; // Path to the uploaded file
}

const expenseSchema = new Schema<IExpense>({
  referenceNumber: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
  category: { type: String, required: true, enum: ['salaries', 'furniture', 'cleaning', 'petty_cash', 'maintenance'] },
  amount: { type: Number, required: true },
  vat: { type: Number, required: true },
  paymentMethod: { type: String, required: true, enum: ['cash', 'credit', 'check', 'transfer'] },
  attachment: { type: String },
}, { timestamps: true });

export const Expense = model<IExpense>('Expense', expenseSchema);
