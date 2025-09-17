import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiAiService } from './ai-features/gemini-ai.service';
import { ContractsAgentService } from './ai-features/contracts-agent.service';

@Module({
  controllers: [ContractsController],
  providers: [
    ContractsService,
    PrismaService,
    GeminiAiService,
    ContractsAgentService,
  ],
})
export class ContractsModule {}
