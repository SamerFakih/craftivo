import { Injectable } from '@nestjs/common';
import { GeminiAiService, AiGenerationResult } from './gemini-ai.service';
import {
  AgentGenerateAndSaveDto,
  ProjectType,
  PaymentStructure,
} from './generate-contract.dto';
import { ContractsService } from '../contracts.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContractDto } from '../dto/create-contract.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ContractsAgentService {
  constructor(
    private readonly gemini: GeminiAiService,
    private readonly contracts: ContractsService,
    private readonly prisma: PrismaService,
  ) {}

  async generateAndSave(dto: AgentGenerateAndSaveDto, userId: number) {
    await this.log(userId, 'agent.plan', 'Generate contract draft', {
      dto: { ...dto, projectDescription: undefined },
    });

    // Ensure freelancer display name
    if (!dto.freelancerName) {
      try {
        const user = await this.prisma.users.findUnique({
          where: { id: userId },
          select: { first_name: true, last_name: true, business_name: true },
        });
        const fallback =
          user?.business_name?.trim() ||
          `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();
        if (fallback) dto.freelancerName = fallback;
      } catch {
        // ignore
      }
    }

    // Derive client name (and client_id) from related entities if missing
    try {
      if (!dto.clientName) {
        if (dto.client_id) {
          const c = await this.prisma.clients.findFirst({
            where: { id: dto.client_id, created_by: userId },
            select: { name: true },
          });
          if (c?.name) dto.clientName = c.name;
        } else if (dto.project_id) {
          const p = await this.prisma.projects.findFirst({
            where: { id: dto.project_id, owner_id: userId },
            select: { client_id: true, clients: { select: { name: true } } },
          });
          if (p?.clients?.name) dto.clientName = p.clients.name;
          if (!dto.client_id && p?.client_id) dto.client_id = p.client_id;
        }
      }
    } catch {
      // ignore
    }

    const ai: AiGenerationResult = await this.gemini.generateContract(dto);
    let content: string = ai.generatedContent || '';
    if (dto.clientName) {
      content = content.replace(/\[CLIENT NAME\]/g, dto.clientName);
    }
    if (dto.freelancerName) {
      content = content.replace(/\[FREELANCER NAME\]/g, dto.freelancerName);
    }

    // Validate references; support snake_case + camelCase
    type ClientCamel = { clientId?: number };
    type ProjectCamel = { projectId?: number };
    const requestedClientId: number | undefined =
      dto.client_id ?? (dto as ClientCamel).clientId;
    let sanitizedClientId: number | undefined = requestedClientId;
    if (requestedClientId) {
      const client = await this.prisma.clients.findFirst({
        where: { id: requestedClientId, created_by: userId },
      });
      if (!client) {
        sanitizedClientId = undefined;
        await this.log(
          userId,
          'agent.warn',
          'Client reference not found, omitting',
          {
            client_id: requestedClientId,
          },
        );
      }
    }

    const requestedProjectId: number | undefined =
      dto.project_id ?? (dto as ProjectCamel).projectId;
    let sanitizedProjectId: number | undefined = requestedProjectId;
    if (requestedProjectId) {
      const project = await this.prisma.projects.findFirst({
        where: { id: requestedProjectId, owner_id: userId },
      });
      if (!project) {
        sanitizedProjectId = undefined;
        await this.log(
          userId,
          'agent.warn',
          'Project reference not found, omitting',
          {
            project_id: requestedProjectId,
          },
        );
      }
    }

    const toCreate: CreateContractDto = {
      title: dto.title,
      client_id: sanitizedClientId,
      project_id: sanitizedProjectId,
      content,
      contract_value: dto.contract_value,
      currency: dto.currency ?? undefined,
      start_date: dto.start_date,
      end_date: dto.end_date,
    };

    const created = await this.contracts.create(toCreate, userId);

    await this.log(userId, 'agent.result', 'Contract generated and saved', {
      contract_id: created.id,
      generationId: ai.generationId,
      aiModel: ai.aiModel,
      confidenceScore: ai.confidenceScore,
      reviewSuggestions: ai.reviewSuggestions,
    });

    return { ...created, aiMeta: ai };
  }

  async generateFromProject(projectId: number, userId: number) {
    const project = await this.prisma.projects.findFirst({
      where: { id: projectId, owner_id: userId },
      select: {
        id: true,
        name: true,
        description: true,
        client_id: true,
        start_date: true,
        end_date: true,
        budget: true,
        currency: true,
        clients: { select: { name: true, email: true } },
      },
    });

    if (!project) {
      // Mirror ContractsService not-found behavior
      throw new Error('Project not found or not owned by user');
    }

    const startDate = project.start_date
      ? new Date(project.start_date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);
    const endDateIso = project.end_date
      ? new Date(project.end_date).toISOString().slice(0, 10)
      : undefined;
    let durationWeeks = 12; // fallback
    if (project.start_date && project.end_date) {
      const days = Math.max(
        1,
        Math.round(
          (new Date(project.end_date).getTime() -
            new Date(project.start_date).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      );
      durationWeeks = Math.max(1, Math.round(days / 7));
    }

    const dto: AgentGenerateAndSaveDto = {
      projectTitle: project.name,
      projectType: ProjectType.WEB_DEVELOPMENT,
      projectDescription: project.description || 'Project scope.',
      budget: Number(project.budget ?? 0),
      currency: project.currency || 'USD',
      paymentStructure: PaymentStructure.MILESTONE,
      durationWeeks,
      startDate,
      deliverables: ['Scope as agreed', 'Milestone payments'],

      title: `${project.name} Agreement`,
      client_id: project.client_id ?? undefined,
      project_id: project.id,
      contract_value: project.budget ? Number(project.budget) : undefined,
      start_date: startDate,
      end_date: endDateIso,

      clientName: project.clients?.name,
    } as AgentGenerateAndSaveDto;

    return this.generateAndSave(dto, userId);
  }

  private async log(
    userId: number,
    action: string,
    note: string,
    extra?: Record<string, unknown>,
  ) {
    try {
      const entityId = (extra as { contract_id?: number } | undefined)
        ?.contract_id;
      await this.prisma.activity_logs.create({
        data: {
          user_id: userId,
          action,
          entity_type: 'contract',
          entity_id: entityId,
          new_values: (extra ?? null) as Prisma.InputJsonValue,
        },
      });
    } catch {
      // ignore
    }
  }
}
