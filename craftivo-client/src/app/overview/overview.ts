import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ProgressBar } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { SummaryCards } from '../components/summary-cards/summary-cards';
import { OverviewService } from '../services/overview.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-overview',
  imports: [CommonModule, ProgressBar, ToastModule, SummaryCards],
  templateUrl: './overview.html',
  styleUrls: ['./overview.css'],
  standalone: true,
  providers: [MessageService],
})
export class Overview {
  value: number = 0;
  interval: any;
  summarys: any[] = [];
  projects: any[] = [];
  tasks: any[] = [];
  teamActivity: any[] = [];

  constructor(private overviewService: OverviewService, private authService: AuthService) {}

  ngOnInit() {
    this.overviewService.getOverviewData().subscribe((data: any) => {
      console.log('Overview data:', data);
      this.summarys = [
        { key: 'Total Revenue', value: data.totalRevenue, icon: 'pi pi-dollar' },
        { key: 'Active Projects', value: data.activeProjects, icon: 'pi pi-check-circle' },
        { key: 'Hours This Month', value: data.hoursThisMonth, icon: 'pi pi-clock' },
        { key: 'Team Members', value: data.teamMembers.length, icon: 'pi pi-users' },
      ];
      this.projects = data.recentProjects;
      this.teamActivity = data.teamActivity;
      this.tasks = data.todayTasks;
    });
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  // projects = [
  //   {
  //     title: 'E-commerce Redesign',
  //     client: 'TechCorp Inc.',
  //     budget: 8500,
  //     due: '2024-04-15',
  //     progress: 75,
  //   },
  //   {
  //     title: 'E-commerce Redesign',
  //     client: 'TechCorp Inc.',
  //     budget: 8500,
  //     due: '2024-04-15',
  //     progress: 50,
  //   },
  //   {
  //     title: 'E-commerce Redesign',
  //     client: 'TechCorp Inc.',
  //     budget: 8500,
  //     due: '2024-04-15',
  //     progress: 25,
  //   },
  // ];

  // summarys = [
  //   { key: 'Total Revenue', value: 24580, icon: 'pi pi-dollar' },
  //   { key: 'Active Projects', value: 5, icon: 'pi pi-check-circle' },
  //   { key: 'Hours This Month', value: 187, icon: 'pi pi-clock' },
  //   { key: 'Team Members', value: 3, icon: 'pi pi-users' },
  // ];
  // tasks = [
  //   { name: 'Client presentation prep', title: 'E-commerce Redesign', endTime: '4:00' },
  //   { name: 'Review wireframes', title: 'E-commerce Redesign', endTime: '6:00' },
  //   { name: 'Update project timeline', title: 'E-commerce Redesign', endTime: '5:00' },
  // ];

  // teamActivity = [
  //   { name: 'Sarah Johnson', status: 'completed task', project: 'E-commerce Redesign' },
  //   { name: 'Mike Chen', status: 'logged 4.5 hours', project: 'E-commerce Redesign' },
  //   { name: 'Emma Davis', status: 'submitted invoice', project: 'E-commerce Redesign' },
  // ];
}
