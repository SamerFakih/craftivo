import { Test, TestingModule } from '@nestjs/testing';
import { OverviewController } from './overview.controller';
import { OverviewService } from './overview.service';

describe('OverviewController', () => {
  let controller: OverviewController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OverviewController],
      providers: [
        {
          provide: OverviewService,
          useValue: {
            getOverview: jest.fn().mockResolvedValue({}),
          },
        },
      ],
    }).compile();

    controller = module.get<OverviewController>(OverviewController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
