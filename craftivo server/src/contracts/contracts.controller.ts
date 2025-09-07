/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { AuthGuard } from '@nestjs/passport';
import { ContractStatus } from '@prisma/client';

@ApiTags('contracts')
@ApiBearerAuth()
@Controller('contracts')
@UseGuards(AuthGuard('jwt'))
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @ApiOperation({ summary: 'Create a new contract' })
  @ApiResponse({
    status: 201,
    description: 'The contract has been successfully created.',
  })
  @Post()
  create(@Body() createContractDto: CreateContractDto, @Request() req) {
    return this.contractsService.create(createContractDto, req.user.userId);
  }

  @ApiOperation({ summary: 'Get all contracts' })
  @ApiResponse({
    status: 200,
    description: 'List of all contracts',
  })
  @Get()
  findAll(@Request() req) {
    return this.contractsService.findAll(req.user.userId);
  }

  @ApiOperation({ summary: 'Get contract by ID' })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.contractsService.findOne(+id, req.user.userId);
  }

  @ApiOperation({ summary: 'Update contract status' })
  @ApiBody({ schema: { properties: { status: { type: 'string' } } } })
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: number,
    @Body('status') status: ContractStatus,
    @Request() req,
  ) {
    return this.contractsService.updateStatus(id, status, req.user.userId);
  }

  @ApiOperation({ summary: 'Sign contract' })
  @Put(':id/sign')
  signContract(
    @Param('id') id: string,
    @Body() signData: SignContractDto,
    @Request() req,
  ) {
    return this.contractsService.signContract(
      +id,
      signData.signature,
      signData.signedBy,
      req.user.userId,
    );
  }

  @ApiOperation({ summary: 'Get contracts by client ID' })
  @Get('client/:clientId')
  getByClient(@Param('clientId') clientId: string, @Request() req) {
    return this.contractsService.findByClient(+clientId, req.user.userId);
  }

  @ApiOperation({ summary: 'Get contracts by project ID' })
  @Get('project/:projectId')
  getByProject(@Param('projectId') projectId: string, @Request() req) {
    return this.contractsService.findByProject(+projectId, req.user.userId);
  }
}
