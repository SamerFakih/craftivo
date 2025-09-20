import { Test, TestingModule } from '@nestjs/testing';
import { OverviewService } from './overview.service';
import { PrismaService } from '../prisma/prisma.service'; // Adjust path if needed

describe('OverviewService', () => {
  let service: OverviewService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OverviewService,
        {
          provide: PrismaService,
          useValue: {}, // Provide a mock implementation if needed
        },
      ],
    }).compile();

    service = module.get<OverviewService>(OverviewService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
