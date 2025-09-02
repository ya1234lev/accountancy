import { Router } from 'express';
import { createIncome, getIncome, getIncomes, updateIncome, deleteIncome, deleteAllIncomes } from '../controllers/incomeController';

const router = Router();


router.post('/incomes', createIncome);
router.get('/incomes/:id', getIncome);
router.get('/incomes', getIncomes);
router.put('/incomes/:id', updateIncome);
router.delete('/incomes/:id', deleteIncome);

// מחיקת כל ההכנסות
router.delete('/incomes', deleteAllIncomes);

export default router;
