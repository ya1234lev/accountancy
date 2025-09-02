import { Expense, IExpense } from "../models/Expense";

export const createExpense = async (expenseData: IExpense): Promise<IExpense> => {
  const expense = new Expense(expenseData);
  return await expense.save();
};

export const getExpenseById = async (id: string): Promise<IExpense | null> => {
  return await Expense.findById(id).populate('supplier');
};

export const getAllExpenses = async (): Promise<IExpense[]> => {
  return await Expense.find().populate('supplier');
};

export const updateExpense = async (id: string, expenseData: Partial<IExpense>): Promise<IExpense | null> => {
  return await Expense.findByIdAndUpdate(id, expenseData, { new: true });
};

export const deleteExpense = async (id: string): Promise<IExpense | null> => {
  return await Expense.findByIdAndDelete(id);
};

// מחיקת כל ההוצאות
export const deleteAllExpenses = async (): Promise<{ deletedCount: number }> => {
  const result = await Expense.deleteMany({});
  return { deletedCount: result.deletedCount };
};