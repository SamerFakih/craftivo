import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectCard } from './project-card';

describe('ProjectCard', () => {
  let component: ProjectCard;
  let fixture: ComponentFixture<ProjectCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectCard);
    component = fixture.componentInstance;
    component.project = {
      id: 1,
      name: 'Sample Project',
      client: 'Acme',
      progress: 50,
      end_date: new Date(Date.now() + 7*86400000).toISOString(),
      tasks: [
        { id: 11, title: 'Task A', status: 'open' },
        { id: 12, title: 'Task B', status: 'done' },
        { id: 13, title: 'Task C', status: 'in-progress' }
      ],
      team: [
        { id: 1, name: 'Alice', avatarUrl: '', role: 'Dev' },
        { id: 2, name: 'Bob', avatarUrl: '', role: 'PM' }
      ],
      spent_amount: 10000,
      budget: 20000,
      status: 'active',
      description: 'Test project'
    } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
