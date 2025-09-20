import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { PrismaService } from '../prisma/prisma.service';

class PrismaStub {
  clients = { create: jest.fn(), findMany: jest.fn() };
}

describe('ClientsService', () => {
  let service: ClientsService;
  let prisma: PrismaStub;

  beforeEach(async () => {
    prisma = new PrismaStub();
    const module: TestingModule = await Test.createTestingModule({
      providers: [ClientsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = module.get(ClientsService);
    prisma.clients.create.mockResolvedValue({ id: 1, name: 'Acme' });
    prisma.clients.findMany.mockResolvedValue([{ id: 1, name: 'Acme' }]);
  });

  it('defined', () => expect(service).toBeDefined());
});
