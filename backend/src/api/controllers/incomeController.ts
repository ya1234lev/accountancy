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
    const incomes = await incomeService.getAllIncomes();
    res.json(incomes);
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
    const income = await incomeService.deleteIncome(req.params.id);
    if (!income) {
      return res.status(404).json({ message: 'Income not found' });
    }
    res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting income', error });
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
