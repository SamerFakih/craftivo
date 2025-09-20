import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Overview } from './overview';
import { OverviewService } from '../services/overview.service';
import { MessageService } from 'primeng/api';

// Simple stub service
class OverviewServiceStub {
  data = {
    totalRevenue: 1000,
    activeProjects: 2,
    hoursThisMonth: 40,
    teamMembers: [{}, {}],
    recentProjects: [
      {
        id: 1,
        name: 'Proj A',
        client: { name: 'Client' },
        budget: 500,
        due: '2024-01-01',
        progress: 50,
      },
    ],
    teamActivity: [{ name: 'User', status: 'did something', project: 'Proj A' }],
    todayTasks: [
      {
        id: 10,
        title: 'Task',
        projects: { name: 'Proj A' },
        due_time: '2024-01-02',
        status: 'open',
      },
    ],
  };
  getOverviewData() {
    return of(this.data);
  }
  invalidateCache() {}
}

describe('Overview', () => {
  let component: Overview;
  let fixture: ComponentFixture<Overview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Overview],
      providers: [MessageService, { provide: OverviewService, useClass: OverviewServiceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(Overview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should populate summarys signal', () => {
    const cards = component.summarys();
    expect(cards.length).toBe(4);
    expect(cards[0].key).toBe('Total Revenue');
  });

  it('should expose projects/tasks/activity from data', () => {
    expect(component.projects().length).toBe(1);
    expect(component.tasks().length).toBe(1);
    expect(component.teamActivity().length).toBe(1);
  });

  it('should refresh without error', () => {
    component.refresh();
    expect(component.loading()).toBeFalse();
  });
});
