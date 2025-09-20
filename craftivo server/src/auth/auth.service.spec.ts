import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

class PrismaStub {
  users = { findUnique: jest.fn(), create: jest.fn() };
}

const jwtStub = {
  sign: jest.fn().mockReturnValue('token'),
} as Partial<JwtService>;

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaStub;
  beforeEach(async () => {
    prisma = new PrismaStub();
    const m: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtStub },
      ],
    }).compile();
    service = m.get(AuthService);
  });
  it('defined', () => expect(service).toBeDefined());
});
