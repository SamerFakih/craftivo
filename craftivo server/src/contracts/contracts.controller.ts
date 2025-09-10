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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
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

  @Post()
  @ApiOperation({ summary: 'Create a new contract' })
  @ApiResponse({
    status: 201,
    description: 'The contract has been successfully created.',
  })
  create(@Body() createContractDto: CreateContractDto, @Request() req) {
    return this.contractsService.create(createContractDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all contracts' })
  @ApiResponse({
    status: 200,
    description: 'List of all contracts',
  })
  findAll(@Request() req) {
    return this.contractsService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contract by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Contract ID' })
  @ApiResponse({
    status: 200,
    description: 'The contract has been successfully retrieved.',
  })
  @ApiResponse({ status: 404, description: 'Contract not found.' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.contractsService.findOne(id, req.user.userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update contract status' })
  @ApiParam({ name: 'id', type: 'number', description: 'Contract ID' })
  @ApiBody({
    schema: {
      properties: {
        status: { type: 'string', enum: Object.values(ContractStatus) },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'The contract status has been successfully updated.',
  })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ContractStatus,
    @Request() req,
  ) {
    return this.contractsService.updateStatus(id, status, req.user.userId);
  }

  @Put(':id/sign')
  @ApiOperation({ summary: 'Sign contract' })
  @ApiParam({ name: 'id', type: 'number', description: 'Contract ID' })
  @ApiBody({ type: SignContractDto })
  @ApiResponse({
    status: 200,
    description: 'The contract has been successfully signed.',
  })
  signContract(
    @Param('id', ParseIntPipe) id: number,
    @Body() signData: SignContractDto,
    @Request() req,
  ) {
    return this.contractsService.signContract(
      id,
      signData.signature,
      signData.signedBy,
      req.user.userId,
    );
  }

  @Get('client/:clientId')
  @ApiOperation({ summary: 'Get contracts by client ID' })
  @ApiParam({ name: 'clientId', type: 'number', description: 'Client ID' })
  @ApiResponse({
    status: 200,
    description: 'List of contracts for the specified client',
  })
  getByClient(
    @Param('clientId', ParseIntPipe) clientId: number,
    @Request() req,
  ) {
    return this.contractsService.findByClient(clientId, req.user.userId);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get contracts by project ID' })
  @ApiParam({ name: 'projectId', type: 'number', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'List of contracts for the specified project',
  })
  getByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Request() req,
  ) {
    return this.contractsService.findByProject(projectId, req.user.userId);
  }
}
