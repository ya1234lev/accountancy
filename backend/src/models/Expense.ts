import { Schema, model, Document, Types } from 'mongoose';

export interface IExpense extends Document {
  id: String
  referenceNumber: string;
  date: Date;
  supplier: string;
  category: 'ריהוט' | 'נקיון' | 'קופה קטנה' | 'תחזוקה' | 'משרד' | 'רכב' | 'שיווק' | 'שירותים מקצועיים' | 'ציוד' | 'חשמל' | 'אחר';
  amount: number;
  vat: number;
  paymentMethod: 'cash' | 'credit' | 'check' | 'transfer';
  attachment?: string; // Path to the uploaded file
}

const expenseSchema = new Schema<IExpense>({
  id: { type: String, required: true },
  referenceNumber: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  supplier: { type: String, required: true },
  category: {
    type: String, 
    required: true, 
    enum: {
      values: ['ריהוט', 'נקיון', 'קופה קטנה', 'תחזוקה', 'משרד', 'רכב', 'שיווק', 'שירותים מקצועיים', 'ציוד', 'חשמל', 'אחר'],
      message: 'קטגוריה לא תקפה: {VALUE}. קטגוריות מותרות: ריהוט, נקיון, קופה קטנה, תחזוקה, משרד, רכב, שיווק, שירותים מקצועיים, ציוד, חשמל, אחר'
    }
  },
  amount: { type: Number, required: true },
  vat: { type: Number, required: true },
  paymentMethod: { type: String, required: true, enum: ['cash', 'credit', 'check', 'transfer'] },
  attachment: { type: String },
}, { timestamps: true });

export const Expense = model<IExpense>('Expense', expenseSchema);
