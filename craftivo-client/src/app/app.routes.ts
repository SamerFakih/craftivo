import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { LandingPage } from './landing-page/landing-page';
import { SignIn } from './signin/signin';
import { SignUp } from './signup/signup';
import { Dashboard } from './dashboard/dashboard';
import { Contract } from './contract/contract';
import { ContractViewerComponent } from './contract/contract-viewer';
import { PublicContractSignComponent } from './contract/public-contract-sign';
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
    canActivate: [AuthGuard],
    children: [
      { path: 'overview', component: Overview, canActivate: [AuthGuard] },
      { path: 'projects', component: Project, canActivate: [AuthGuard] },
      { path: 'tasks', component: Task, canActivate: [AuthGuard] },
      { path: 'invoices', component: Invoice, canActivate: [AuthGuard] },
      { path: 'time-tracking', component: TimeTracking, canActivate: [AuthGuard] },
      { path: 'teams', component: Team, canActivate: [AuthGuard] },
      { path: 'clients', component: Client, canActivate: [AuthGuard] },
      { path: 'contracts', component: Contract, canActivate: [AuthGuard] },
      { path: 'contracts/:id', component: ContractViewerComponent, canActivate: [AuthGuard] },
    ],
  },
  // Public signing route (no auth guard) - token placeholder (will be non-numeric usually)
  { path: 'sign/:token', component: PublicContractSignComponent },
  { path: '**', redirectTo: '' },
];
