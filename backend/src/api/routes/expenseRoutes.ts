import { Router } from 'express';
import { createExpense, getExpense, getExpenses, updateExpense, deleteExpense, deleteAllExpenses, uploadPdf, upload } from '../controllers/expenseController';

const router = Router();

router.post('/expenses', createExpense);
router.get('/expenses/:id', getExpense);
router.get('/expenses', getExpenses);
router.put('/expenses/:id', updateExpense);
router.delete('/expenses/:id', deleteExpense);

// מחיקת כל ההוצאות
router.delete('/expenses', deleteAllExpenses);

// העלאת PDF עם טיפול בשגיאות
router.post('/expenses/upload-pdf', (req, res, next) => {
    upload.single('pdfFile')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'הקובץ גדול מדי - מקסימום 50MB'
                });
            }
            return res.status(400).json({
                success: false,
                message: 'שגיאה בהעלאת הקובץ: ' + err.message
            });
        }
        uploadPdf(req, res);
    });
});

export default router;
