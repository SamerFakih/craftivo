import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeEntries } from './time-entries';

describe('TimeEntries', () => {
  let component: TimeEntries;
  let fixture: ComponentFixture<TimeEntries>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeEntries]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeEntries);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
