import { Routes } from '@angular/router';
import { LandingPage } from './landing-page/landing-page';
import { SignIn } from './signin/signin';
import { SignUp } from './signup/signup';
import { Dashboard } from './dashboard/dashboard';

export const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'signin', component: SignIn },
  { path: 'signup', component: SignUp },
  { path: 'dashboard', component: Dashboard },
  { path: '**', redirectTo: '' },
];
