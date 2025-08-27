import { Routes } from '@angular/router';
import { BookkeepingComponent } from './bookkeeping/bookkeeping.component';

export const routes: Routes = [
  { path: '', component: BookkeepingComponent },
  { path: '**', redirectTo: '' }
];