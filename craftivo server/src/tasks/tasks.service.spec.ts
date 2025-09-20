import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';

class PrismaStub {
  tasks = { findMany: jest.fn(), create: jest.fn() };
}

describe('TasksService', () => {
  let service: TasksService;
  let prisma: PrismaStub;
  beforeEach(async () => {
    prisma = new PrismaStub();
    const m: TestingModule = await Test.createTestingModule({
      providers: [TasksService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = m.get(TasksService);
  });
  it('defined', () => expect(service).toBeDefined());
});
