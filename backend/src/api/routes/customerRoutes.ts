import { Router } from 'express';
import { createCustomer, getCustomer, getCustomers, updateCustomer, deleteCustomer } from '../controllers/customerController';

const router = Router();

router.post('/customers', createCustomer);
router.get('/customers/:id', getCustomer);
router.get('/customers', getCustomers);
router.put('/customers/:id', updateCustomer);
router.delete('/customers/:id', deleteCustomer);

export default router;
