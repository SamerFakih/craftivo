import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Put,
  ParseIntPipe,
  Delete,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import type { Response } from 'express';
import { Res } from '@nestjs/common';
import { StreamableFile } from '@nestjs/common';
import { CreateContractDto } from './dto/create-contract.dto';
import { SignContractDto } from './dto/sign-contract.dto';
import { AgentGenerateAndSaveDto } from './ai-features/generate-contract.dto';
import { ContractsAgentService } from './ai-features/contracts-agent.service';
import { AuthGuard } from '@nestjs/passport';
import { ContractStatus } from '@prisma/client';
import { UpdateContractDto } from './dto/update-contract.dto';
import { SendContractDto } from './dto/send-contract.dto';
import { SignRoleDto as RoleSignDto } from './dto/role-sign.dto';
import { RegenerateContractDto } from './dto/regenerate-contract.dto';
import { UserId } from '../common/decorators/user-id.decorator';
import { ContractVersionDto } from './dto/contract-version.dto';

@ApiTags('contracts')
@ApiBearerAuth()
@Controller('contracts')
@UseGuards(AuthGuard('jwt'))
export class ContractsController {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly contractsAgent: ContractsAgentService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new contract' })
  @ApiResponse({
    status: 201,
    description: 'The contract has been successfully created.',
  })
  create(
    @Body() createContractDto: CreateContractDto,
    @UserId() userId: number,
  ) {
    return this.contractsService.create(createContractDto, userId);
  }

  @Get()
  @ApiOperation({
    summary: 'List contracts (filterable)',
    description:
      'Supports filtering by client, project, status (single or comma-separated), full-text search (title & content), date range, and pagination. Returns { data, meta } wrapper.',
  })
  @ApiQuery({ name: 'clientId', required: false, type: Number })
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Single status or comma list',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'ISO date lower bound (created_at)',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'ISO date upper bound (created_at)',
  })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  @ApiQuery({ name: 'take', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Filtered contract list with pagination meta',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { type: 'object' } },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            skip: { type: 'number' },
            take: { type: 'number' },
          },
        },
      },
    },
  })
  list(
    @UserId() userId: number,
    @Query('clientId') clientId?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    const statusParam = status
      ? status
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;
    const statusValue = statusParam
      ? statusParam.length === 1
        ? statusParam[0]
        : statusParam
      : undefined;
    return this.contractsService.list(userId, {
      clientId: clientId ? Number(clientId) : undefined,
      projectId: projectId ? Number(projectId) : undefined,
      // Casting narrowed union / array to service's accepted shape (already validated loosely)
      status: statusValue as unknown as
        | ContractStatus
        | ContractStatus[]
        | undefined,
      search,
      from,
      to,
      skip: skip ? Number(skip) : undefined,
      take: take ? Math.min(Number(take), 100) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contract by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Contract ID' })
  @ApiResponse({
    status: 200,
    description: 'The contract has been successfully retrieved.',
  })
  @ApiResponse({ status: 404, description: 'Contract not found.' })
  findOne(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.contractsService.findOne(id, userId);
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
    @UserId() userId: number,
  ) {
    return this.contractsService.updateStatus(id, status, userId);
  }

  // General update (title, value, currency, content -> version)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update contract fields / new version if content changed',
  })
  @ApiParam({ name: 'id', type: 'number' })
  updateContract(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContractDto,
    @UserId() userId: number,
  ) {
    return this.contractsService.updateContract(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete contract' })
  remove(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.contractsService.softDelete(id, userId);
  }

  @Post(':id/send')
  @ApiOperation({ summary: 'Send contract to recipients (issues sign tokens)' })
  send(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SendContractDto,
    @UserId() userId: number,
  ) {
    return this.contractsService.send(id, userId, dto);
  }

  @Post(':id/resend')
  @ApiOperation({ summary: 'Resend contract notifications' })
  resend(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.contractsService.resend(id, userId);
  }

  @Post(':id/regenerate')
  @ApiOperation({
    summary: 'Regenerate contract (creates new version placeholder)',
  })
  regenerate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegenerateContractDto,
    @UserId() userId: number,
  ) {
    return this.contractsService.regenerate(id, userId, dto);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'List contract versions' })
  @ApiResponse({ status: 200, type: ContractVersionDto, isArray: true })
  versions(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.contractsService.getVersions(id, userId);
  }

  @Get(':id/versions/:versionId')
  @ApiOperation({ summary: 'Get a specific contract version' })
  @ApiParam({ name: 'versionId', type: 'number' })
  @ApiResponse({ status: 200, type: ContractVersionDto })
  getVersion(
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
    @UserId() userId: number,
  ) {
    return this.contractsService.getVersion(id, versionId, userId);
  }

  @Post(':id/versions/:versionId/make-current')
  @ApiOperation({
    summary: 'Set an existing version as current (no new version created)',
  })
  @ApiParam({ name: 'versionId', type: 'number' })
  @ApiResponse({ status: 200, description: 'Version set as current' })
  makeVersionCurrent(
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
    @UserId() userId: number,
  ) {
    return this.contractsService.makeVersionCurrent(id, versionId, userId);
  }

  @Post(':id/versions/:versionId/revert')
  @ApiOperation({
    summary: 'Revert to a past version (creates new version copy)',
  })
  @ApiParam({ name: 'versionId', type: 'number' })
  @ApiResponse({
    status: 201,
    type: ContractVersionDto,
    description: 'New version created from revert',
  })
  revertToVersion(
    @Param('id', ParseIntPipe) id: number,
    @Param('versionId', ParseIntPipe) versionId: number,
    @UserId() userId: number,
  ) {
    return this.contractsService.revertToVersion(id, versionId, userId);
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'List contract audit log' })
  audit(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.contractsService.getAudit(id, userId);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download contract PDF' })
  async download(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { filename, buffer } = await this.contractsService.downloadPdf(
      id,
      userId,
    );
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length.toString(),
    });
    return new StreamableFile(buffer);
  }

  @Post(':id/sign')
  @ApiOperation({ summary: 'Role-based sign (client or freelancer)' })
  roleSign(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RoleSignDto,
    @UserId() userId: number,
  ) {
    return this.contractsService.roleSign(id, userId, dto);
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
    @UserId() userId: number,
  ) {
    return this.contractsService.signContract(
      id,
      userId,
      signData.signature,
      signData.signedBy,
    );
  }

  @Get('client/:clientId')
  @ApiExcludeEndpoint()
  getByClient(
    @Param('clientId', ParseIntPipe) clientId: number,
    @UserId() userId: number,
  ) {
    return this.contractsService.findByClient(clientId, userId);
  }

  @Get('project/:projectId')
  @ApiExcludeEndpoint()
  getByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @UserId() userId: number,
  ) {
    return this.contractsService.findByProject(projectId, userId);
  }

  // Unified agent endpoint replacing previous generate + simple-generate variants
  @Post('agent/run')
  @ApiOperation({
    summary: 'Run AI contract generation agent and persist draft',
    description:
      'Executes a multi-step agent pipeline (plan, generate, personalize, persist, summarize) and returns the created draft contract with metadata.',
  })
  @ApiBody({ type: AgentGenerateAndSaveDto })
  @ApiResponse({
    status: 201,
    description: 'Contract generated and saved via agent',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number' },
        title: { type: 'string' },
        status: { type: 'string' },
        content: { type: 'string' },
        aiMeta: { type: 'object' },
        agent: {
          type: 'object',
          properties: {
            durationMs: { type: 'number' },
            steps: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Validation / generation error' })
  async agentRun(
    @Body() dto: AgentGenerateAndSaveDto,
    @UserId() userId: number,
  ) {
    return this.contractsAgent.run(dto, userId);
  }

  @Post('agent/from-project/:projectId')
  @ApiOperation({
    summary: 'Generate contract from a project',
    description:
      'Fetch project and client data from the database by projectId, build a generation DTO, and save a draft contract',
  })
  @ApiParam({ name: 'projectId', type: 'number', description: 'Project ID' })
  @ApiResponse({
    status: 201,
    description: 'Contract generated and saved via agent (project derived)',
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found or not owned by user',
  })
  async generateFromProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @UserId() userId: number,
  ) {
    return this.contractsAgent.generateFromProject(projectId, userId);
  }

  @Get(':id/agent-logs')
  @ApiOperation({ summary: 'Get agent activity logs for a contract' })
  @ApiParam({ name: 'id', type: 'number', description: 'Contract ID' })
  @ApiResponse({ status: 200, description: 'List of activity logs' })
  getAgentLogs(
    @Param('id', ParseIntPipe) id: number,
    @UserId() userId: number,
  ) {
    return this.contractsService.findAgentLogs(id, userId);
  }
}
