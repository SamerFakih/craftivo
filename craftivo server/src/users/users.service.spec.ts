import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

class PrismaStub {
  users = { findMany: jest.fn(), findUnique: jest.fn() };
}

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaStub;
  beforeEach(async () => {
    prisma = new PrismaStub();
    const m: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = m.get(UsersService);
  });
  it('defined', () => expect(service).toBeDefined());
});
