import { IIncome, Income } from "../models/Income";

interface QueryOptions {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  customer?: string;
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

export const createIncome = async (incomeData: IIncome): Promise<IIncome> => {
  const income = new Income(incomeData);
  return await income.save();
};

export const getIncomeById = async (id: string): Promise<IIncome | null> => {
  return await Income.findById(id).populate('customer');
};

export const getAllIncomes = async (options?: QueryOptions): Promise<IIncome[] | PaginatedResult<IIncome>> => {
  if (!options) {
    // Default behavior - return all incomes for backward compatibility
    return await Income.find().populate('customer').lean().exec();
  }

  const { page = 1, limit = 100, startDate, endDate, minAmount, maxAmount, customer } = options;

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
  
  if (customer) {
    query.customer = customer;
  }

  // Calculate pagination
  const skip = (page - 1) * limit;
  
  // Execute query with pagination
  const [data, total] = await Promise.all([
    Income.find(query)
      .populate('customer')
      .sort({ date: -1 }) // Sort by date descending
      .skip(skip)
      .limit(limit)
      .lean()
      .exec(),
    Income.countDocuments(query)
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

export const updateIncome = async (id: string, incomeData: Partial<IIncome>): Promise<IIncome | null> => {
  return await Income.findByIdAndUpdate(id, incomeData, { new: true });
};

export const deleteIncome = async (id: string): Promise<IIncome | null> => {
  console.log('incomeService.deleteIncome - מנסה למחוק עם ID:', id);
  console.log('סוג ה-ID:', typeof id);
  
  try {
    const result = await Income.findByIdAndDelete(id);
    console.log('תוצאת המחיקה:', result);
    return result;
  } catch (error) {
    console.error('שגיאה במחיקה מבסיס הנתונים:', error);
    throw error;
  }
};

// מחיקת כל ההכנסות
export const deleteAllIncomes = async (): Promise<{ deletedCount: number }> => {
  const result = await Income.deleteMany({});
  return { deletedCount: result.deletedCount };
};