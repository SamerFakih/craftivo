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
import {
  GenerateContractDto,
  AgentGenerateAndSaveDto,
  ProjectType,
  PaymentStructure,
} from './ai-features/generate-contract.dto';
import { GeminiAiService } from './ai-features/gemini-ai.service';
import { ContractsAgentService } from './ai-features/contracts-agent.service';
import { SimpleGenerateDto } from './ai-features/simple-generate.dto';
import { AuthGuard } from '@nestjs/passport';
import { ContractStatus } from '@prisma/client';
import { UserId } from '../common/decorators/user-id.decorator';

@ApiTags('contracts')
@ApiBearerAuth()
@Controller('contracts')
@UseGuards(AuthGuard('jwt'))
export class ContractsController {
  constructor(
    private readonly contractsService: ContractsService,
    private readonly geminiAiService: GeminiAiService,
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
  @ApiOperation({ summary: 'Get all contracts' })
  @ApiResponse({
    status: 200,
    description: 'List of all contracts',
  })
  findAll(@UserId() userId: number) {
    return this.contractsService.findAll(userId);
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
  ) {
    return this.contractsService.updateStatus(id, status);
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
  ) {
    return this.contractsService.signContract(
      id,
      signData.signature,
      signData.signedBy,
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
    @UserId() userId: number,
  ) {
    return this.contractsService.findByClient(clientId, userId);
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
    @UserId() userId: number,
  ) {
    return this.contractsService.findByProject(projectId, userId);
  }

  @Post('ai/generate')
  @ApiOperation({
    summary: 'Generate contract using AI',
    description:
      'Generate a professional contract using Google Gemini AI based on project details',
    deprecated: true,
  })
  @ApiBody({
    type: GenerateContractDto,
    description: 'Project details for contract generation',
  })
  @ApiResponse({
    status: 200,
    description: 'Contract successfully generated',
    schema: {
      type: 'object',
      properties: {
        generationId: { type: 'number' },
        generatedContent: { type: 'string' },
        aiModel: { type: 'string' },
        processingTime: { type: 'number' },
        estimatedCost: { type: 'number' },
        confidenceScore: { type: 'number' },
        reviewSuggestions: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid request data.' })
  generateContract(@Body() generateDto: GenerateContractDto) {
    return this.geminiAiService.generateContract(generateDto);
  }

  @Post('ai/generate-and-save')
  @ApiOperation({
    summary: 'AI generate contract and save as draft',
    description:
      'Agent-like flow: generate a professional contract using Gemini and immediately persist it as a draft contract',
  })
  @ApiBody({ type: AgentGenerateAndSaveDto })
  @ApiResponse({ status: 201, description: 'Contract generated and saved' })
  async generateAndSave(
    @Body() dto: AgentGenerateAndSaveDto,
    @UserId() userId: number,
  ) {
    return this.contractsAgent.generateAndSave(dto, userId);
  }

  @Post('ai/simple-generate-and-save')
  @ApiOperation({
    summary: 'Simple generate and save (UI form compatible)',
    description:
      'Accepts a simple form payload from the UI, maps to the agent DTO, and saves a draft contract',
    deprecated: true,
  })
  @ApiBody({ type: SimpleGenerateDto })
  @ApiResponse({ status: 201, description: 'Contract generated and saved' })
  async simpleGenerateAndSave(
    @Body() form: SimpleGenerateDto,
    @UserId() userId: number,
  ) {
    // Minimal mapping assumptions for simple UI
    const title = `${form.projectTitle || 'Service'} Agreement`;
    const startDate = form.startDate || undefined;
    const endDate = form.endDate || undefined;
    const contractValue = form.totalAmount ?? undefined;

    // Build a brief description including toggles
    const toggles: string[] = [];
    if (form.includeKillFee) toggles.push('Kill Fee');
    if (form.includeRushFee) toggles.push('Rush Fee');
    if (form.ipOwnership) toggles.push('IP Ownership Transfer');
    if (form.includeNda) toggles.push('NDA');

    const extras = toggles.length
      ? `\n\nIncluded terms: ${toggles.join(', ')}.`
      : '';
    const custom = form.customTerms
      ? `\n\nCustom Terms: ${form.customTerms}`
      : '';

    const projectDescription = `${form.description || 'Professional services engagement.'}${extras}${custom}`;

    // Map payment schedule to the enum used by generator; fallback to 'milestone'
    const paymentStructure = PaymentStructure.MILESTONE;

    // Duration heuristic if dates provided; otherwise default 12 weeks
    let durationWeeks = 12;
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const days = Math.max(
        1,
        Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)),
      );
      durationWeeks = Math.max(1, Math.round(days / 7));
    }

    const dto: AgentGenerateAndSaveDto = {
      // Generation fields
      projectTitle: form.projectTitle,
      projectType: ProjectType.WEB_DEVELOPMENT,
      projectDescription,
      budget: contractValue ?? 0,
      currency: 'USD',
      paymentStructure,
      durationWeeks,
      startDate: startDate || new Date().toISOString().slice(0, 10),
      deliverables: ['Project scope as agreed', 'Milestone-based payments'],
      clientName: form.clientName,

      // Persistence fields
      title,
      contract_value: contractValue,
      start_date: startDate,
      end_date: endDate,
      // Accept IDs from the simple form for association and name derivation
      client_id: form.clientId,
      project_id: form.projectId,
    } as AgentGenerateAndSaveDto;

    return this.contractsAgent.generateAndSave(dto, userId);
  }

  @Post('ai/from-project/:projectId')
  @ApiOperation({
    summary: 'Generate contract from a project',
    description:
      'Fetch project and client data from the database by projectId, build a generation DTO, and save a draft contract',
  })
  @ApiParam({ name: 'projectId', type: 'number', description: 'Project ID' })
  @ApiResponse({ status: 201, description: 'Contract generated and saved' })
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
