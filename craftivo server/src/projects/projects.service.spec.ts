import { Test, TestingModule } from '@nestjs/testing';
import { ProjectsService } from './projects.service';
import { PrismaService } from '../prisma/prisma.service';

class PrismaStub {
  projects = { findMany: jest.fn(), create: jest.fn() };
}

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: PrismaStub;
  beforeEach(async () => {
    prisma = new PrismaStub();
    const m: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = m.get(ProjectsService);
  });
  it('defined', () => expect(service).toBeDefined());
});
