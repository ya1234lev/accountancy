import { Request, Response } from 'express';
import * as reportService from '../../services/reportService';

export const getIncomeVsExpenseReport = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const report = await reportService.getIncomeVsExpenseReport(new Date(startDate as string), new Date(endDate as string));
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error generating report', error });
  }
};

export const getIncomeAnalysisReport = async (req: Request, res: Response) => {
  try {
    const { groupBy, startDate, endDate } = req.query;
    if (!groupBy || !startDate || !endDate) {
      return res.status(400).json({ message: 'Group by, start date and end date are required' });
    }

    if (groupBy !== 'customer' && groupBy !== 'date' && groupBy !== 'paymentMethod') {
      return res.status(400).json({ message: 'Invalid group by value' });
    }

    const report = await reportService.getIncomeAnalysisReport(groupBy, new Date(startDate as string), new Date(endDate as string));
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error generating report', error });
  }
};

export const getExpenseAnalysisReport = async (req: Request, res: Response) => {
  try {
    const { groupBy, startDate, endDate } = req.query;
    if (!groupBy || !startDate || !endDate) {
      return res.status(400).json({ message: 'Group by, start date and end date are required' });
    }

    if (groupBy !== 'category' && groupBy !== 'date' && groupBy !== 'paymentMethod') {
      return res.status(400).json({ message: 'Invalid group by value' });
    }

    const report = await reportService.getExpenseAnalysisReport(groupBy, new Date(startDate as string), new Date(endDate as string));
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Error generating report', error });
  }
};
