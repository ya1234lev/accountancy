import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import customerRoutes from './api/routes/customerRoutes';
import supplierRoutes from './api/routes/supplierRoutes';
import incomeRoutes from './api/routes/incomeRoutes';
import expenseRoutes from './api/routes/expenseRoutes';
import reportRoutes from './api/routes/reportRoutes';

const app = express();

// CORS - מאפשר ל-frontend להתחבר לשרת
app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:4201'], 
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// נתיב בסיסי לבדיקת חיבור
app.get('/', (req, res) => {
  res.json({ 
    message: 'Accountancy Backend API is running!',
    status: 'success',
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /api/customers',
      'POST /api/customers',
      'GET /api/suppliers',
      'GET /api/income',
      'GET /api/expenses',
      'GET /api/reports'
    ]
  });
});

// API Routes
app.use('/api', customerRoutes);
app.use('/api', supplierRoutes);
app.use('/api', incomeRoutes);
app.use('/api', expenseRoutes);
app.use('/api', reportRoutes);

export default app;
