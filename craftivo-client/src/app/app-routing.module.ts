import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Overview } from './overview/overview';
import { Project } from './project/project';
import { Task } from './task/task';
import { Invoice } from './invoice/invoice';
import { TimeTracking } from './time-tracking/time-tracking';
import { Team } from './team/team';
import { Client } from './client/client';
import { Contract } from './contract/contract';

const routes: Routes = [
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
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
    ],
  },
  { path: '', redirectTo: '/dashboard/overview', pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
