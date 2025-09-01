import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { PrismaService } from './prisma/prisma.service';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { TimeEntriesModule } from './time-entries/time-entries.module';
import { InvoicesModule } from './invoices/invoices.module';
import { TeamsModule } from './teams/teams.module';
import { ContractsModule } from './contracts/contracts.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ClientsModule,
    ProjectsModule,
    TasksModule,
    TimeEntriesModule,
    InvoicesModule,
    TeamsModule,
    ContractsModule,
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  providers: [PrismaService],
})
export class AppModule {}
