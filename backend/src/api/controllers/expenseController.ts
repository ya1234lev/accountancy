import { Request, Response } from 'express';
import * as expenseService from '../../services/expenseService';

export const createExpense = async (req: Request, res: Response) => {
  try {
    console.log("req.body", req.body);

    const expense = await expenseService.createExpense(req.body);
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Error creating expense', error });
  }
};

export const getExpense = async (req: Request, res: Response) => {
  try {
    const expense = await expenseService.getExpenseById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Error getting expense', error });
  }
};

export const getExpenses = async (req: Request, res: Response) => {
  try {
    const expenses = await expenseService.getAllExpenses();
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Error getting expenses', error });
  }
};

export const updateExpense = async (req: Request, res: Response) => {
  try {
    const expense = await expenseService.updateExpense(req.params.id, req.body);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Error updating expense', error });
  }
};

export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const expense = await expenseService.deleteExpense(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting expense', error });
  }
};

// מחיקת כל ההוצאות
export const deleteAllExpenses = async (req: Request, res: Response) => {
  try {
    const result = await expenseService.deleteAllExpenses();
    res.json({ message: 'All expenses deleted successfully', deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting all expenses', error });
  }
};
