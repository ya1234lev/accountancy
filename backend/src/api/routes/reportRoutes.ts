import { Router } from 'express';
import { getIncomeVsExpenseReport, getIncomeAnalysisReport, getExpenseAnalysisReport } from '../controllers/reportController';

const router = Router();

router.get('/reports/income-vs-expense', getIncomeVsExpenseReport);
router.get('/reports/income-analysis', getIncomeAnalysisReport);
router.get('/reports/expense-analysis', getExpenseAnalysisReport);

export default router;
