import { Router } from 'express';
import { createIncome, getIncome, getIncomes, updateIncome, deleteIncome } from '../controllers/incomeController';

const router = Router();

router.post('/incomes', createIncome);
router.get('/incomes/:id', getIncome);
router.get('/incomes', getIncomes);
router.put('/incomes/:id', updateIncome);
router.delete('/incomes/:id', deleteIncome);

export default router;
