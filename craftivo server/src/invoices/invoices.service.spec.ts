import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../prisma/prisma.service';

class PrismaStub {
  invoices = { findMany: jest.fn(), create: jest.fn() };
}

describe('InvoicesService', () => {
  let service: InvoicesService;
  let prisma: PrismaStub;
  beforeEach(async () => {
    prisma = new PrismaStub();
    const m: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = m.get(InvoicesService);
  });
  it('defined', () => expect(service).toBeDefined());
});
