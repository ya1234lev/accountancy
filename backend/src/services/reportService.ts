import mongoose from 'mongoose';
import { Income } from '../models/Income';
import { Expense } from '../models/Expense';

export const getIncomeVsExpenseReport = async (startDate: Date, endDate: Date) => {
  const incomes = await Income.find({
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  });

  const expenses = await Expense.find({
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  });

  const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return {
    startDate,
    endDate,
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    incomes,
    expenses,
  };
};

export const getIncomeAnalysisReport = async (groupBy: 'customer' | 'date' | 'paymentMethod', startDate: Date, endDate: Date) => {
  const match = {
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  let group;
  if (groupBy === 'customer') {
    group = { _id: '$customer', totalAmount: { $sum: '$amount' } };
  } else if (groupBy === 'date') {
    group = { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, totalAmount: { $sum: '$amount' } };
  } else {
    group = { _id: '$payment.method', totalAmount: { $sum: '$amount' } };
  }

  const analysis = await Income.aggregate([
    { $match: match },
    { $group: group },
    { $sort: { _id: 1 } },
  ]);

  return analysis;
};

export const getExpenseAnalysisReport = async (groupBy: 'category' | 'date' | 'paymentMethod', startDate: Date, endDate: Date) => {
  const match = {
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  };

  let group;
  if (groupBy === 'category') {
    group = { _id: '$category', totalAmount: { $sum: '$amount' } };
  } else if (groupBy === 'date') {
    group = { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, totalAmount: { $sum: '$amount' } };
  } else {
    group = { _id: '$paymentMethod', totalAmount: { $sum: '$amount' } };
  }

  const analysis = await Expense.aggregate([
    { $match: match },
    { $group: group },
    { $sort: { _id: 1 } },
  ]);

  return analysis;
};
