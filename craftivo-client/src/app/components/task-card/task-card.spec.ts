import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskCard } from './task-card';

describe('TaskCard', () => {
  let component: TaskCard;
  let fixture: ComponentFixture<TaskCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskCard],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCard);
    component = fixture.componentInstance;
    component.task = {
      id: 1,
      title: 'Sample Task',
      status: 'open',
      dueISO: new Date(Date.now() + 3600000).toISOString(),
      assignee: 'Jane',
    } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
