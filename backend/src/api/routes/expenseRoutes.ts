import { Router } from 'express';
import { createExpense, getExpense, getExpenses, updateExpense, deleteExpense, deleteAllExpenses } from '../controllers/expenseController';

const router = Router();


router.post('/expenses', createExpense);
router.get('/expenses/:id', getExpense);
router.get('/expenses', getExpenses);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

// מחיקת כל ההוצאות
router.delete('/expenses', deleteAllExpenses);

export default router;
