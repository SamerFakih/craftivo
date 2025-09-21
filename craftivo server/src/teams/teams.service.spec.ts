import { Test, TestingModule } from '@nestjs/testing';
import { TeamsService } from './teams.service';
import { PrismaService } from '../prisma/prisma.service';

class PrismaStub {
  teams = { findMany: jest.fn(), create: jest.fn() };
}

describe('TeamsService', () => {
  let service: TeamsService;
  let prisma: PrismaStub;
  beforeEach(async () => {
    prisma = new PrismaStub();
    const m: TestingModule = await Test.createTestingModule({
      providers: [TeamsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = m.get(TeamsService);
  });
  it('defined', () => expect(service).toBeDefined());
});
