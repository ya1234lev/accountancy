import { Router } from 'express';
import { createSupplier, getSupplier, getSuppliers, updateSupplier, deleteSupplier, deleteAllSuppliers } from '../controllers/supplierController';

const router = Router();


router.post('/suppliers', createSupplier);
router.get('/suppliers/:id', getSupplier);
router.get('/suppliers', getSuppliers);
router.put('/suppliers/:id', updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);

// מחיקת כל הספקים
router.delete('/suppliers', deleteAllSuppliers);

export default router;
