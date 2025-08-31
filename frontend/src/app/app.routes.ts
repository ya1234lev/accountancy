import { Routes } from '@angular/router';
import { BookkeepingComponent } from './bookkeeping/bookkeeping.component';
import { IncomeComponent } from './components/income/income.component';

export const routes: Routes = [
  { path: '', component: BookkeepingComponent },
  { path: 'income', component: IncomeComponent },
  { path: '**', redirectTo: '' }
];