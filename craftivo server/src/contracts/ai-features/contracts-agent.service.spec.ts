import { Test, TestingModule } from '@nestjs/testing';
import { ContractsAgentService } from './contracts-agent.service';
import { GeminiAiService } from './gemini-ai.service';
import { ContractsService } from '../contracts.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AgentGenerateAndSaveDto,
  PaymentStructure,
  ProjectType,
} from './generate-contract.dto';

class PrismaStub {
  users = { findUnique: jest.fn() };
  clients = { findFirst: jest.fn() };
  projects = { findFirst: jest.fn() };
  activity_logs = { create: jest.fn() };
}

describe('ContractsAgentService', () => {
  let service: ContractsAgentService;
  const geminiStub = {
    generateContract: jest
      .fn()
      .mockResolvedValue({ generatedContent: 'Content', generationId: 1 }),
  } as Partial<GeminiAiService>;
  const contractsStub = {
    create: jest.fn().mockResolvedValue({
      id: 99,
      content: 'Content',
      title: 'T',
      status: 'draft',
    }),
  } as Partial<ContractsService>;
  let prisma: PrismaStub;

  beforeEach(async () => {
    prisma = new PrismaStub();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsAgentService,
        { provide: GeminiAiService, useValue: geminiStub },
        { provide: ContractsService, useValue: contractsStub },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(ContractsAgentService);
  });

  it('run() returns agent metadata and calls underlying create', async () => {
    const dto: AgentGenerateAndSaveDto = {
      projectTitle: 'X',
      projectType: ProjectType.WEB_DEVELOPMENT,
      projectDescription: 'Desc',
      budget: 1000,
      paymentStructure: PaymentStructure.MILESTONE,
      durationWeeks: 4,
      startDate: new Date().toISOString().slice(0, 10),
      deliverables: ['A'],
      title: 'Agreement',
    } as AgentGenerateAndSaveDto;
    const result = await service.run(dto, 1);
    expect(result.id).toBe(99);
    expect(result.agent).toBeDefined();
    expect(result.agent.steps).toContain('generate');
  });
});
