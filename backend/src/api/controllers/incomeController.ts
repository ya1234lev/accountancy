import { Request, Response } from 'express';
import * as incomeService from '../../services/incomeService';

export const createIncome = async (req: Request, res: Response) => {
  try {
    const income = await incomeService.createIncome(req.body);
    res.status(201).json(income);
  } catch (error) {
    res.status(500).json({ message: 'Error creating income', error });
  }
};

export const getIncome = async (req: Request, res: Response) => {
  try {
    const income = await incomeService.getIncomeById(req.params.id);
    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }
    res.json(income);
  } catch (error) {
    res.status(500).json({ message: 'Error getting income', error });
  }
};

export const getIncomes = async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 100, 
      startDate, 
      endDate, 
      minAmount, 
      maxAmount, 
      customer 
    } = req.query;

    const options = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      startDate: startDate as string,
      endDate: endDate as string,
      minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
      customer: customer as string
    };

    const result = await incomeService.getAllIncomes(options);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error getting incomes', error });
  }
};

export const updateIncome = async (req: Request, res: Response) => {
  try {
    const income = await incomeService.updateIncome(req.params.id, req.body);
    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }
    res.json(income);
  } catch (error) {
    res.status(500).json({ message: 'Error updating income', error });
  }
};

export const deleteIncome = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    console.log('מנסה למחוק הכנסה עם ID:', id);
    
    const income = await incomeService.deleteIncome(id);
    if (!income) {
      console.log('הכנסה לא נמצאה עם ID:', id);
      return res.status(404).json({ message: 'Income not found' });
    }
    
    console.log('הכנסה נמחקה בהצלחה:', income);
    res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    console.error('שגיאה במחיקת הכנסה:', error);
    console.error('ID שנתקבל:', req.params.id);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ message: 'Error deleting income', error: errorMessage });
  }
};

// מחיקת כל ההכנסות
export const deleteAllIncomes = async (req: Request, res: Response) => {
  try {
    const result = await incomeService.deleteAllIncomes();
    res.json({ message: 'All incomes deleted successfully', deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting all incomes', error });
  }
};