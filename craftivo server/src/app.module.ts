import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { PrismaService } from './prisma/prisma.service';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';
import { TimeEntriesModule } from './time-entries/time-entries.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    ClientsModule,
    ProjectsModule,
    TasksModule,
    TimeEntriesModule,
  ],
  providers: [PrismaService],
})
export class AppModule {}
