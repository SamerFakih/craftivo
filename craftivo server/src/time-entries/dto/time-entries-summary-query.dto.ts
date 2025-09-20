import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum TimeEntriesSummaryGroupBy {
  PROJECT = 'project',
  // Future: CLIENT = 'client', USER = 'user', DATE = 'date'
}

export class TimeEntriesSummaryQueryDto {
  @ApiPropertyOptional({
    enum: TimeEntriesSummaryGroupBy,
    description: 'Group aggregation dimension',
    default: TimeEntriesSummaryGroupBy.PROJECT,
  })
  @IsOptional()
  @IsEnum(TimeEntriesSummaryGroupBy)
  groupBy?: TimeEntriesSummaryGroupBy = TimeEntriesSummaryGroupBy.PROJECT;

  // Reuse date filtering semantics if needed later (optional extension point)
}

export interface TimeEntriesProjectSummaryRow {
  project_id: number | null; // null when no project linked
  project_name: string | null;
  entry_count: number;
  total_duration_seconds: number;
  total_hours: number;
  total_amount: number;
}
