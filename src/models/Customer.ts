import { Schema, model, Document } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
}

const customerSchema = new Schema<ICustomer>({
  name: { type: String, required: true },
  contactPerson: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
}, { timestamps: true });

export const Customer = model<ICustomer>('Customer', customerSchema);
