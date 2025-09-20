import { Test, TestingModule } from '@nestjs/testing';
import { TimeEntriesService } from './time-entries.service';
import { PrismaService } from '../prisma/prisma.service';

class PrismaStub {
  time_entries = { findMany: jest.fn(), create: jest.fn() };
}

describe('TimeEntriesService', () => {
  let service: TimeEntriesService;
  let prisma: PrismaStub;
  beforeEach(async () => {
    prisma = new PrismaStub();
    const m: TestingModule = await Test.createTestingModule({
      providers: [
        TimeEntriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = m.get(TimeEntriesService);
  });
  it('defined', () => expect(service).toBeDefined());
});
