import { Schema, model, Document, Types } from 'mongoose';

interface IPaymentDetails {
  method: 'cash' | 'credit' | 'check' | 'transfer';
  amount: number;
  creditCard?: {
    last4Digits: string;
    installments?: number;
  };
  check?: {
    checkNumber: string;
    accountNumber: string;
    bankNumber: string;
    dueDate: Date;
  };
  transfer?: {
    referenceNumber: string;
    accountNumber: string;
    bankNumber: string;
  };
}

export interface IIncome extends Document {
  receiptNumber: string;
  date: Date;
  customer: Types.ObjectId;
  amount: number;
  vat: number;
  payment: IPaymentDetails;
  details?: string;
  receiptPrintedDate?: Date;
}

const paymentDetailsSchema = new Schema<IPaymentDetails>({
  method: { type: String, required: true, enum: ['cash', 'credit', 'check', 'transfer'] },
  amount: { type: Number, required: true },
  creditCard: {
    last4Digits: { type: String },
    installments: { type: Number },
  },
  check: {
    checkNumber: { type: String },
    accountNumber: { type: String },
    bankNumber: { type: String },
    dueDate: { type: Date },
  },
  transfer: {
    referenceNumber: { type: String },
    accountNumber: { type: String },
    bankNumber: { type: String },
  },
}, { _id: false });

const incomeSchema = new Schema<IIncome>({
  receiptNumber: { type: String, required: true, unique: true },
  date: { type: Date, required: true, default: Date.now },
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  amount: { type: Number, required: true },
  vat: { type: Number, required: true },
  payment: { type: paymentDetailsSchema, required: true },
  details: { type: String },
  receiptPrintedDate: { type: Date },
}, { timestamps: true });

export const Income = model<IIncome>('Income', incomeSchema);
