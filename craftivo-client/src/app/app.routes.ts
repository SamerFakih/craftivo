import { Routes } from '@angular/router';
import { LandingPage } from './landing-page/landing-page';
import { SignIn } from './signin/signin';

export const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'signin', component: SignIn }, // ✅ Remove the leading slash
  // Remove signup route until you create the component
  { path: '**', redirectTo: '' },
];
