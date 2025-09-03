import { Routes } from '@angular/router';
import { LandingPage } from './landing-page/landing-page';
import { SignIn } from './signin/signin';
import { SignUp } from './signup/signup';
import { Dashboard } from './dashboard/dashboard';
import { Contract } from './contract/contract';
import { Client } from './client/client';
import { Team } from './team/team';
import { TimeTracking } from './time-tracking/time-tracking';
import { Invoice } from './invoice/invoice';
import { Task } from './task/task';
import { Project } from './project/project';
import { Overview } from './overview/overview';

export const routes: Routes = [
  { path: '', component: LandingPage },
  { path: 'signin', component: SignIn },
  { path: 'signup', component: SignUp },
  {
    path: 'dashboard',
    component: Dashboard,
    children: [
      { path: 'overview', component: Overview },
      { path: 'projects', component: Project },
      { path: 'tasks', component: Task },
      { path: 'invoices', component: Invoice },
      { path: 'time-tracking', component: TimeTracking },
      { path: 'teams', component: Team },
      { path: 'clients', component: Client },
      { path: 'contracts', component: Contract },
    ],
  },
  { path: '**', redirectTo: '' },
];
