/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { OverviewService } from './overview.service';
import { OverviewDto } from './dto/overview.dto';

@ApiTags('overview')
@ApiBearerAuth()
@Controller('overview')
@UseGuards(AuthGuard('jwt'))
export class OverviewController {
  constructor(private readonly overviewService: OverviewService) {}

  @Get()
  async getOverview(@Request() req): Promise<OverviewDto> {
    return this.overviewService.getOverview(req.user.user_id);
  }
}
