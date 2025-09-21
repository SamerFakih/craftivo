import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberCard } from './member-card';

describe('MemberCard', () => {
  let component: MemberCard;
  let fixture: ComponentFixture<MemberCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberCard],
    }).compileComponents();

    fixture = TestBed.createComponent(MemberCard);
    component = fixture.componentInstance;
    component.member = {
      id: 1,
      name: 'Jane Dev',
      avatarUrl: 'http://example/avatar.png',
      status: 'active',
      hourlyRateUSD: 75,
      hoursMonth: 40,
      activeProjects: 3,
      tasksDone: 10,
    } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
