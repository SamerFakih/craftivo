import { CommonModule } from '@angular/common';
import { Component, NgZone } from '@angular/core';
import { ProgressBar } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-overview',
  imports: [CommonModule, ProgressBar, ToastModule],
  templateUrl: './overview.html',
  styleUrls: ['./overview.css'],
  standalone: true,
  providers: [MessageService],
})
export class Overview {
  value: number = 70;

  interval: any;

  constructor(private messageService: MessageService, private ngZone: NgZone) {}

  ngOnInit() {
    this.ngZone.runOutsideAngular(() => {
      this.interval = setInterval(() => {
        this.ngZone.run(() => {
          this.value = this.value + Math.floor(Math.random() * 10) + 1;
          if (this.value >= 100) {
            this.value = 100;
            this.messageService.add({
              severity: 'info',
              summary: 'Success',
              detail: 'Process Completed',
            });
            clearInterval(this.interval);
          }
        });
      }, 2000);
    });
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
  summary = {
    revenue: 24580,
    projects: 8,
    hours: 187,
    team: 5,
  };

  projects = [
    {
      title: 'E-commerce Redesign',
      client: 'TechCorp Inc.',
      budget: 8500,
      due: '2024-04-15',
      progress: 75,
    },
    {
      title: 'E-commerce Redesign',
      client: 'TechCorp Inc.',
      budget: 8500,
      due: '2024-04-15',
      progress: 50,
    },
    {
      title: 'E-commerce Redesign',
      client: 'TechCorp Inc.',
      budget: 8500,
      due: '2024-04-15',
      progress: 25,
    },
  ];

  tasks = [
    { name: 'Client presentation prep', title: 'E-commerce Redesign', endTime: '4:00' },
    { name: 'Review wireframes', title: 'E-commerce Redesign', endTime: '6:00' },
    { name: 'Update project timeline', title: 'E-commerce Redesign', endTime: '5:00' },
  ];

  teamActivity = [
    { name: 'Sarah Johnson', status: 'completed task', project: 'E-commerce Redesign' },
    { name: 'Mike Chen', status: 'logged 4.5 hours', project: 'E-commerce Redesign' },
    { name: 'Emma Davis', status: 'submitted invoice', project: 'E-commerce Redesign' },
  ];
}
