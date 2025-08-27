import { Customer, ICustomer } from "../models/Customer";

export const createCustomer = async (customerData: ICustomer): Promise<ICustomer> => {
  const customer = new Customer(customerData);
  return await customer.save();
};

export const getCustomerById = async (id: string): Promise<ICustomer | null> => {
  return await Customer.findById(id);
};

export const getAllCustomers = async (): Promise<ICustomer[]> => {
  return await Customer.find();
};

export const updateCustomer = async (id: string, customerData: Partial<ICustomer>): Promise<ICustomer | null> => {
  return await Customer.findByIdAndUpdate(id, customerData, { new: true });
};

export const deleteCustomer = async (id: string): Promise<ICustomer | null> => {
  return await Customer.findByIdAndDelete(id);
};
