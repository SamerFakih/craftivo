/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import { PrismaService } from '../prisma/prisma.service';
import { PdfService } from '../common/services/pdf.service';
import { EmailService } from '../common/services/email.service';
import { ContractStatus } from '@prisma/client';

// Simple in-memory stubs

class PrismaStub {
  contracts = {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  };
  contract_sign_tokens = {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  };
  contract_versions = { findFirst: jest.fn(), create: jest.fn() };
  contract_audit_logs = { create: jest.fn() };
}

class PdfStub {
  htmlToPdfBuffer = jest.fn().mockResolvedValue(Buffer.from('PDF'));
}
class EmailStub {
  sendContractEmail = jest.fn().mockResolvedValue(undefined);
}

describe('ContractsService send flow', () => {
  let service: ContractsService;
  let prisma: PrismaStub;
  let email: EmailStub;

  beforeEach(async () => {
    prisma = new PrismaStub();
    email = new EmailStub();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: PrismaService, useValue: prisma },
        { provide: PdfService, useClass: PdfStub },
        { provide: EmailService, useValue: email },
      ],
    }).compile();

    service = module.get(ContractsService);
    // default contract stub
    prisma.contracts.findUnique.mockResolvedValue({
      id: 1,
      title: 'Test',
      content: '<p>Body</p>',
    });
    prisma.contracts.findFirst.mockResolvedValue({ id: 1 });
    prisma.contract_versions.findFirst.mockResolvedValue(null);
    prisma.contract_versions.create.mockResolvedValue({
      id: 10,
      version_number: 1,
    });
    prisma.contracts.update.mockResolvedValue({
      id: 1,
      status: ContractStatus.sent,
    });
  });

  it('creates tokens, updates status, and triggers email', async () => {
    const result = await service.send(1, 123, {
      recipients: [
        { role: 'client', email: 'c@example.com' },
        { role: 'freelancer', email: 'f@example.com' },
      ],
      message: 'Please sign',
      subject: 'Agreement',
    });

    expect(prisma.contracts.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
    expect(prisma.contract_sign_tokens.create).toHaveBeenCalledTimes(2);
    expect(prisma.contracts.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 1 },
        data: expect.objectContaining({ status: ContractStatus.sent }),
      }),
    );
    expect(email.sendContractEmail).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.tokens).toHaveLength(2);
  });
});
