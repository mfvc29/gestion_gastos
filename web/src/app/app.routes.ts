import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { AddTransaction } from './components/add-transaction/add-transaction';
import { Profile } from './components/profile/profile';
import { Metrics } from './components/metrics/metrics';
import { Login } from './components/login/login';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: '', component: Home, canActivate: [authGuard] },
  { path: 'add', component: AddTransaction, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
  { path: 'metrics', component: Metrics, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
