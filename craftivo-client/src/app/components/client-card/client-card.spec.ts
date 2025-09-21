import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientCard } from './client-card';

describe('ClientCard', () => {
  let component: ClientCard;
  let fixture: ComponentFixture<ClientCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClientCard);
    component = fixture.componentInstance;
    component.client = {
      id: 1,
      name: 'Client One',
      avatarUrl: 'http://example/avatar.png',
      status: 'active',
      email: 'client@example.com',
      location: 'Remote',
      primaryContact: 'Jane Smith',
      industry: 'Tech',
      joinedISO: '2024-01-01',
      tags: ['priority','retainer'],
      stats: {
        totalProjects: 4,
        activeProjects: 2,
        totalRevenueUSD: 120000,
        lastContactISO: '2025-09-01'
      }
    } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
