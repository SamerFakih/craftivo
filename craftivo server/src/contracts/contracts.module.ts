import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiAiService } from './ai-features/gemini-ai.service';
import { ContractsAgentService } from './ai-features/contracts-agent.service';
import { PublicContractsController } from './public-contracts.controller';
import { PdfService } from '../common/services/pdf.service';
import { EmailService } from '../common/services/email.service';

@Module({
  controllers: [ContractsController, PublicContractsController],
  providers: [
    ContractsService,
    PrismaService,
    GeminiAiService,
    ContractsAgentService,
    PdfService,
    EmailService,
  ],
})
export class ContractsModule {}
