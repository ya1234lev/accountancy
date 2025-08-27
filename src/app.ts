import express from 'express';
import bodyParser from 'body-parser';
import customerRoutes from './api/routes/customerRoutes';
import supplierRoutes from './api/routes/supplierRoutes';
import incomeRoutes from './api/routes/incomeRoutes';
import expenseRoutes from './api/routes/expenseRoutes';
import reportRoutes from './api/routes/reportRoutes';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', customerRoutes);
app.use('/api', supplierRoutes);
app.use('/api', incomeRoutes);
app.use('/api', expenseRoutes);
app.use('/api', reportRoutes);

export default app;
