import { Module } from '@nestjs/common';
import { OverviewController } from './overview.controller';
import { OverviewService } from './overview.service';
import { PrismaModule } from '../prisma/prisma.module'; // Import if OverviewService uses PrismaService

@Module({
  imports: [PrismaModule], // Add this if needed
  controllers: [OverviewController],
  providers: [OverviewService],
  exports: [OverviewService], // Optional, if used in other modules
})
export class OverviewModule {}
