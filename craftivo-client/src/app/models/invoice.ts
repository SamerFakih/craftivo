export type InvoiceStatus = 'paid' | 'pending' | 'overdue';

export interface InvoiceModel {
  id: string; // e.g. 'INV-001'
  client: string; // e.g. 'TechCorp Inc.'
  project: string; // e.g. 'E-commerce Redesign'
  amountUSD: number; // 8500 => $8,500
  currency?: string; // default 'USD'
  issuedISO: string; // '2024-08-01'
  dueISO: string; // '2024-08-31'
  paidISO?: string; // present if paid
  status: InvoiceStatus; // 'paid' | 'pending' | 'overdue'
}
