import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { PublicSignDto } from './dto/public-sign.dto';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@ApiTags('contracts-public')
@Controller('contracts/public')
export class PublicContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get(':token')
  @ApiParam({ name: 'token', description: 'Public signing/view token' })
  @ApiOperation({ summary: 'Public view limited contract content via token' })
  view(@Param('token') token: string) {
    return this.contractsService.publicView(token);
  }

  @Post(':token/sign')
  @ApiParam({ name: 'token', description: 'Public signing token' })
  @ApiOperation({ summary: 'Public sign (client or freelancer) via token' })
  sign(@Param('token') token: string, @Body() dto: PublicSignDto) {
    return this.contractsService.publicSign(token, dto);
  }
}
