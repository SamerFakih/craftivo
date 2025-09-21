import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvoiceCard } from './invoice-card';

describe('InvoiceCard', () => {
  let component: InvoiceCard;
  let fixture: ComponentFixture<InvoiceCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InvoiceCard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InvoiceCard);
    component = fixture.componentInstance;
    component.invoice = {
      id: 1,
      client: 'Acme Co',
      project: 'Demo',
      amountUSD: 1000,
      issuedISO: new Date().toISOString(),
      dueISO: new Date(Date.now() + 86400000).toISOString(),
      paidISO: undefined,
      status: 'pending',
      currency: 'USD'
    } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
