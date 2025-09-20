import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TimeTracking } from './time-tracking';
import { TimeTrackingService } from '../services/time-tracking.service';

class MockTimeTrackingService {
  // simple in-memory store for created entries
  created: any[] = [];
  getTimeEntries() {
    return of([]);
  }
  listTimeEntries() {
    return of({
      data: [],
      meta: { page: 1, pageSize: 50, total: 0, hasNext: false, hasPrev: false },
    } as any);
  }
  createTimeEntry(payload: any) {
    const entry = { id: 'srv-' + (this.created.length + 1), ...payload };
    this.created.push(entry);
    return of({ data: entry });
  }
  updateTimeEntry(id: string, payload: any) {
    return of({ data: { id, ...payload } });
  }
  deleteTimeEntry(id: string) {
    return of({ deleted: true });
  }
  getKpis() {
    return of({
      data: { totalHours: 0, totalRevenue: 0, entriesCount: 0, period: { from: '', to: '' } },
    });
  }
  getProjectSummary() {
    return of({ data: [] });
  }
}

describe('TimeTracking', () => {
  let component: TimeTracking;
  let fixture: ComponentFixture<TimeTracking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeTracking],
      providers: [{ provide: TimeTrackingService, useClass: MockTimeTrackingService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TimeTracking);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('adds a manual entry and updates KPIs (hours)', () => {
    const initialToday = component.todayH();
    // Prepare form
    component.openManual();
    const form = component.manualForm;
    form.patchValue({
      title: 'Design session',
      project: 'E-commerce Redesign',
      client: 'Acme',
      dateISO: new Date().toISOString().slice(0, 10),
      startTime: '09:00',
      endTime: '10:30',
      hours: 1.5,
      amountUSD: 225,
      note: 'UI wireframes',
      status: 'completed',
    });
    component.submitManual();
    // optimistic add happened
    expect(component.entries().some((e) => e.title === 'Design session')).toBeTrue();
    // force change detection for computed signals
    fixture.detectChanges();
    expect(component.todayH()).toBeCloseTo(initialToday + 1.5, 5);
  });

  it('filters by project', () => {
    // Ensure there is at least one entry for filtering
    component.entries.update((list) => [
      {
        id: 'x1',
        title: 'A',
        project: 'P1',
        client: 'C1',
        dateISO: '2025-01-01',
        startTime: '09:00',
        endTime: '10:00',
        hours: 1,
        amountUSD: 50,
        status: 'completed',
      },
      {
        id: 'x2',
        title: 'B',
        project: 'P2',
        client: 'C1',
        dateISO: '2025-01-01',
        startTime: '10:00',
        endTime: '11:00',
        hours: 1,
        amountUSD: 60,
        status: 'completed',
      },
    ]);
    component.setProjectFilter('P1');
    const visible = component.visibleEntries();
    expect(visible.length).toBe(1);
    expect(visible[0].project).toBe('P1');
  });

  it('applies status filter', () => {
    component.entries.update((_) => [
      {
        id: 'r1',
        title: 'Running task',
        project: 'Alpha',
        client: 'C',
        dateISO: '2025-01-02',
        startTime: '09:00',
        endTime: '09:30',
        hours: 0.5,
        amountUSD: 40,
        status: 'running',
      },
      {
        id: 'c1',
        title: 'Completed task',
        project: 'Alpha',
        client: 'C',
        dateISO: '2025-01-02',
        startTime: '09:30',
        endTime: '10:30',
        hours: 1,
        amountUSD: 80,
        status: 'completed',
      },
    ]);
    component.setStatusFilter('running');
    expect(component.visibleEntries().every((e) => e.status === 'running')).toBeTrue();
  });
});
