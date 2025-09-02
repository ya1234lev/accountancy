import { Routes } from '@angular/router';
import { BookkeepingComponent } from './bookkeeping/bookkeeping.component';
import { IncomeComponent } from './components/income/income.component';
import { ExpenseComponent } from './components/expense/expense.component';

export const routes: Routes = [
  { path: '', component: BookkeepingComponent },
  { path: 'income', component: IncomeComponent },
  { path: 'expense', component: ExpenseComponent },
  { path: '**', redirectTo: '' }
];