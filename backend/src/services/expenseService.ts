import { Expense, IExpense } from "../models/Expense";

interface QueryOptions {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  supplier?: string;
  category?: string;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const createExpense = async (expenseData: IExpense): Promise<IExpense> => {
  const expense = new Expense(expenseData);
  return await expense.save();
};

export const getExpenseById = async (id: string): Promise<IExpense | null> => {
  return await Expense.findById(id).populate('supplier');
};

export const getAllExpenses = async (options?: QueryOptions): Promise<IExpense[] | PaginatedResult<IExpense>> => {
  if (!options) {
    // Default behavior - return all expenses for backward compatibility
    return await Expense.find().populate('supplier').lean().exec();
  }

  const { page = 1, limit = 100, startDate, endDate, minAmount, maxAmount, supplier, category } = options;

  // Build query filters
  const query: any = {};
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  
  if (minAmount !== undefined || maxAmount !== undefined) {
    query.amount = {};
    if (minAmount !== undefined) query.amount.$gte = minAmount;
    if (maxAmount !== undefined) query.amount.$lte = maxAmount;
  }
  
  if (supplier) {
    query.supplier = supplier;
  }
  
  if (category) {
    query.category = { $regex: category, $options: 'i' };
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Execute query with pagination
  const [data, total] = await Promise.all([
    Expense.find(query)
      .populate('supplier')
      .sort({ date: -1 }) // Sort by date descending
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Expense.countDocuments(query)
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
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