import { Router } from 'express';
import { createSupplier, getSupplier, getSuppliers, updateSupplier, deleteSupplier } from '../controllers/supplierController';

const router = Router();

router.post('/suppliers', createSupplier);
router.get('/suppliers/:id', getSupplier);
router.get('/suppliers', getSuppliers);
router.put('/suppliers/:id', updateSupplier);
router.delete('/suppliers/:id', deleteSupplier);

export default router;
