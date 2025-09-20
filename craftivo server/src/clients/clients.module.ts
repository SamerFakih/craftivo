import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [ClientsService, PrismaService],
  controllers: [ClientsController],
  exports: [ClientsService],
})
export class ClientsModule {}
