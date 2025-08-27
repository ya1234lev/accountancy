import { IIncome, Income } from "../models/Income";

export const createIncome = async (incomeData: IIncome): Promise<IIncome> => {
  const income = new Income(incomeData);
  return await income.save();
};

export const getIncomeById = async (id: string): Promise<IIncome | null> => {
  return await Income.findById(id).populate('customer');
};

export const getAllIncomes = async (): Promise<IIncome[]> => {
  return await Income.find().populate('customer');
};

export const updateIncome = async (id: string, incomeData: Partial<IIncome>): Promise<IIncome | null> => {
  return await Income.findByIdAndUpdate(id, incomeData, { new: true });
};

export const deleteIncome = async (id: string): Promise<IIncome | null> => {
  return await Income.findByIdAndDelete(id);
};
