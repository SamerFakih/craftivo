/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { parseDate } from '../common/utils/date.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { ContractStatus } from '@prisma/client';
import { UpdateContractDto } from './dto/update-contract.dto';
import { SendContractDto } from './dto/send-contract.dto';
import { SignRoleDto as RoleSignDto, SignatureType } from './dto/role-sign.dto';
import { RegenerateContractDto } from './dto/regenerate-contract.dto';
import { PublicSignDto } from './dto/public-sign.dto';
import { PdfService } from '../common/services/pdf.service';
import { EmailService } from '../common/services/email.service';
import * as crypto from 'crypto';

// Query parameter type for new RESTful listing endpoint
type ContractListParams = {
  clientId?: number;
  projectId?: number;
  status?: ContractStatus | ContractStatus[];
  search?: string; // matches title or content
  from?: string; // ISO date lower bound (created_at)
  to?: string; // ISO date upper bound (created_at)
  skip?: number;
  take?: number; // pagination size
};

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
    private emailService: EmailService,
  ) {}

  // ---------- Internal helpers ----------
  private async assertOwnership(contractId: number, userId: number) {
    const c = await (this.prisma as any).contracts.findFirst({
      where: { id: contractId, user_id: userId, deleted_at: null } as any,
      select: { id: true },
    });
    if (!c) throw new NotFoundException('Contract not found');
  }

  private async log(
    contractId: number,
    action: string,
    details?: Record<string, unknown>,
    userId?: number,
  ) {
    try {
      await (this.prisma as any).contract_audit_logs.create({
        data: {
          contract_id: contractId,
          action,
          details: details as unknown as object,
          user_id: userId,
        },
      });
    } catch {
      // Swallow audit errors to not block main flow
    }
  }

  private async createVersion(
    contractId: number,
    content: string,
    generatedBy: string,
    metadata?: Record<string, unknown>,
  ) {
    const last = await (this.prisma as any).contract_versions.findFirst({
      where: { contract_id: contractId },
      orderBy: { version_number: 'desc' },
      select: { version_number: true },
    });
    const versionNumber = (last?.version_number || 0) + 1;
    const version = await (this.prisma as any).contract_versions.create({
      data: {
        contract_id: contractId,
        content,
        version_number: versionNumber,
        generated_by: generatedBy,
        metadata: metadata as unknown as object,
      },
    });
    await (this.prisma as any).contracts.update({
      where: { id: contractId },
      data: { current_version_id: version.id } as any,
    });
    return version;
  }

  async create(createContractDto: CreateContractDto, userId: number) {
    // Parse date strings
    const { start_date, end_date, ...rest } = createContractDto;

    const payload: {
      title: string;
      client_id?: number;
      project_id?: number;
      template_id?: number;
      content: string;
      status: ContractStatus;
      contract_value?: number;
      currency?: string;
      start_date?: Date;
      end_date?: Date;
      user_id: number;
    } = {
      ...(rest as Omit<typeof rest, 'start_date' | 'end_date'>),
      user_id: userId,
      status: ContractStatus.draft,
    };

    const s = parseDate(start_date);
    if (s) payload.start_date = s;
    const e = parseDate(end_date);
    if (e) payload.end_date = e;

    const created = await this.prisma.contracts.create({
      data: payload,
    });
    await this.createVersion(created.id, created.content, 'manual');
    await this.log(created.id, 'create', { status: created.status }, userId);
    return created;
  }

  findAll(userId: number) {
    return (this.prisma as any).contracts.findMany({
      where: { user_id: userId, deleted_at: null } as any,
      include: { clients: true, projects: true },
    });
  }

  // New filtered / paginated list (will back the new GET /contracts endpoint with query params)
  async list(userId: number, params: ContractListParams) {
    const {
      clientId,
      projectId,
      status,
      search,
      from,
      to,
      skip = 0,
      take = 25,
    } = params || {};

    const where: any = { user_id: userId, deleted_at: null };
    if (clientId) where.client_id = clientId;
    if (projectId) where.project_id = projectId;
    if (status) {
      if (Array.isArray(status)) where.status = { in: status };
      else where.status = status;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }
    const fromDate = parseDate(from);
    const toDate = parseDate(to);
    if (fromDate || toDate) {
      where.created_at = {};
      if (fromDate) where.created_at.gte = fromDate;
      if (toDate) where.created_at.lte = toDate;
    }

    const [data, total] = await this.prisma.$transaction([
      this.prisma.contracts.findMany({
        where,
        include: { clients: true, projects: true },
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),
      this.prisma.contracts.count({ where }),
    ]);

    return { data, meta: { total, skip, take } };
  }

  async findOne(id: number, userId: number) {
    const contract = await (this.prisma as any).contracts.findFirst({
      where: { id, user_id: userId, deleted_at: null } as any,
      include: { clients: true, projects: true },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    return contract;
  }

  async updateStatus(id: number, status: ContractStatus, userId: number) {
    await this.assertOwnership(id, userId);
    const updated = await this.prisma.contracts.update({
      where: { id },
      data: { status },
    });
    await this.log(id, 'status_change', { status }, userId);
    return updated;
  }

  async updateContract(id: number, userId: number, dto: UpdateContractDto) {
    await this.assertOwnership(id, userId);
    const existing = await this.prisma.contracts.findUnique({
      where: { id },
      select: {
        content: true,
        status: true,
        contract_value: true,
        currency: true,
        title: true,
      },
    });
    if (!existing) throw new NotFoundException('Contract not found');

    const { content, metadata, ...rest } = dto;
    const updated = await this.prisma.contracts.update({
      where: { id },
      data: { ...rest },
    });
    if (content && content !== existing.content) {
      await this.prisma.contracts.update({
        where: { id },
        data: { content },
      });
      await this.createVersion(id, content, 'manual_edit', { metadata });
    }
    await this.log(id, 'update', { fields: Object.keys(dto) }, userId);
    return updated;
  }

  async softDelete(id: number, userId: number) {
    await this.assertOwnership(id, userId);
    await (this.prisma as any).contracts.update({
      where: { id },
      data: { deleted_at: new Date() } as any,
    });
    await this.log(id, 'delete', undefined, userId);
    return { success: true };
  }

  async signContract(
    id: number,
    userId: number,
    signature: string,
    signedBy: string,
  ) {
    // Ensure the authenticated user owns the contract before allowing a direct sign
    await this.assertOwnership(id, userId);
    const updated = await this.prisma.contracts.update({
      where: { id },
      data: {
        status: ContractStatus.signed,
        signed_date: new Date(),
        signed_by_client: signedBy,
        signature_client: signature,
      },
    });
    await this.log(id, 'sign', { role: 'client' }, userId);
    return updated;
  }

  async roleSign(id: number, userId: number, dto: RoleSignDto) {
    await this.assertOwnership(id, userId);
    const contract = await this.prisma.contracts.findUnique({
      where: { id },
    });
    if (!contract) throw new NotFoundException('Contract not found');
    if (contract.status === ContractStatus.signed)
      throw new BadRequestException('Already fully signed');

    const updateData: Record<string, any> = {};
    if (dto.role === 'client') {
      if (contract.signed_by_client)
        throw new BadRequestException('Client already signed');
      updateData.signed_by_client = dto.name;
      if (dto.signatureType === SignatureType.drawn)
        updateData.signature_client = dto.signatureData;
    } else {
      if (contract.signed_by_freelancer)
        throw new BadRequestException('Freelancer already signed');
      updateData.signed_by_freelancer = dto.name;
      if (dto.signatureType === SignatureType.drawn)
        updateData.signature_freelancer = dto.signatureData;
    }

    // Determine next status (explicitly annotate to avoid narrow inference from existing enum union)
    let nextStatus: ContractStatus = contract.status;
    const bothSigned =
      (updateData.signed_by_client || contract.signed_by_client) &&
      (updateData.signed_by_freelancer || contract.signed_by_freelancer);
    if (bothSigned) {
      nextStatus = ContractStatus.signed;
      updateData.signed_date = new Date();
    } else if (contract.status === ContractStatus.draft) {
      nextStatus = ContractStatus.sent; // or partially_signed derivative if you add one later
    }
    updateData.status = nextStatus;

    const updated = await this.prisma.contracts.update({
      where: { id },
      data: updateData,
    });
    await this.log(id, 'sign', { role: dto.role }, userId);
    return updated;
  }

  async send(id: number, userId: number, dto: SendContractDto) {
    await this.assertOwnership(id, userId);
    const contract = await this.prisma.contracts.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');

    // Issue tokens for each role missing a signature
    const tokens: { role: string; token: string }[] = [];
    for (const r of dto.recipients) {
      const token = crypto.randomBytes(24).toString('hex');
      await (this.prisma as any).contract_sign_tokens.create({
        data: {
          contract_id: id,
          role: r.role,
          token,
          expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        },
      });
      tokens.push({ role: r.role, token });
    }
    await (this.prisma as any).contracts.update({
      where: { id },
      data: { last_sent_at: new Date(), status: ContractStatus.sent } as any,
    });
    await this.log(id, 'send', { recipients: dto.recipients.length }, userId);
    try {
      await this.emailService.sendContractEmail({
        contractId: id,
        recipients: tokens.map((t) => ({
          email: 'placeholder@example.com',
          role: t.role,
          token: t.token,
        })),
        subject: dto.subject || `Contract: ${contract.title}`,
        message: dto.message,
      });
    } catch {
      /* swallow email errors for now */
    }
    return { success: true, tokens };
  }

  async resend(id: number, userId: number) {
    await this.assertOwnership(id, userId);
    await (this.prisma as any).contracts.update({
      where: { id },
      data: { last_sent_at: new Date() } as any,
    });
    await this.log(id, 'resend', undefined, userId);
    // Re-dispatch email notifications with existing active tokens (simplified)
    try {
      const activeTokens = await (
        this.prisma as any
      ).contract_sign_tokens.findMany({
        where: {
          contract_id: id,
          used_at: null,
          expires_at: { gt: new Date() },
        },
      });
      await this.emailService.sendContractEmail({
        contractId: id,
        recipients: activeTokens.map((t) => ({
          email: 'placeholder@example.com',
          role: t.role,
          token: t.token,
        })),
        subject: `Contract Resent #${id}`,
      });
    } catch {
      /* ignore email errors */
    }
    return { success: true };
  }

  async regenerate(id: number, userId: number, dto: RegenerateContractDto) {
    await this.assertOwnership(id, userId);
    const contract = await this.prisma.contracts.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');
    // For now we just mutate value & create a new version placeholder (AI integration later)
    const newContent = contract.content; // Future: call AI to regenerate
    await this.createVersion(id, newContent, 'regenerate', dto.metadata);
    if (dto.contract_value !== undefined) {
      await this.prisma.contracts.update({
        where: { id },
        data: { contract_value: dto.contract_value },
      });
    }
    await this.log(
      id,
      'regenerate',
      { contract_value: dto.contract_value },
      userId,
    );
    return { success: true };
  }

  async getVersions(id: number, userId: number) {
    await this.assertOwnership(id, userId);
    return (this.prisma as any).contract_versions.findMany({
      where: { contract_id: id },
      orderBy: { version_number: 'asc' },
    });
  }

  // Get single version detail
  async getVersion(id: number, versionId: number, userId: number) {
    await this.assertOwnership(id, userId);
    const version = await (this.prisma as any).contract_versions.findFirst({
      where: { id: versionId, contract_id: id },
    });
    if (!version) throw new NotFoundException('Version not found');
    return version;
  }

  // Make an existing version the current one (without creating a new version)
  async makeVersionCurrent(id: number, versionId: number, userId: number) {
    await this.assertOwnership(id, userId);
    const version = await (this.prisma as any).contract_versions.findFirst({
      where: { id: versionId, contract_id: id },
      select: { id: true },
    });
    if (!version) throw new NotFoundException('Version not found');
    await (this.prisma as any).contracts.update({
      where: { id },
      data: { current_version_id: version.id } as any,
    });
    await this.log(id, 'version_make_current', { versionId }, userId);
    return { success: true };
  }

  // Revert (copy) a version: clone its content into a brand new version and set as current
  async revertToVersion(id: number, versionId: number, userId: number) {
    await this.assertOwnership(id, userId);
    const version = await (this.prisma as any).contract_versions.findFirst({
      where: { id: versionId, contract_id: id },
    });
    if (!version) throw new NotFoundException('Version not found');
    const newVersion = await this.createVersion(
      id,
      version.content as string,
      'revert',
      { revertedFrom: versionId },
    );
    await this.log(
      id,
      'version_revert',
      { from: versionId, to: newVersion.id },
      userId,
    );
    return newVersion;
  }

  async getAudit(id: number, userId: number) {
    await this.assertOwnership(id, userId);
    return (this.prisma as any).contract_audit_logs.findMany({
      where: { contract_id: id },
      orderBy: { created_at: 'desc' },
    });
  }

  async publicView(token: string) {
    const tokenRow = await (this.prisma as any).contract_sign_tokens.findFirst({
      where: { token },
      include: { contracts: true },
    });
    if (!tokenRow || tokenRow.used_at || tokenRow.expires_at < new Date())
      throw new NotFoundException('Invalid token');
    const c = tokenRow.contracts;
    return {
      id: c.id,
      title: c.title,
      content: c.content,
      status: c.status,
      signed_by_client: !!c.signed_by_client,
      signed_by_freelancer: !!c.signed_by_freelancer,
      canSignForRole: tokenRow.role,
    };
  }

  async publicSign(token: string, dto: PublicSignDto) {
    const tokenRow = await (this.prisma as any).contract_sign_tokens.findFirst({
      where: { token },
      include: { contracts: true },
    });
    if (!tokenRow || tokenRow.used_at || tokenRow.expires_at < new Date())
      throw new NotFoundException('Invalid token');
    const c = tokenRow.contracts;

    const roleDto: RoleSignDto = {
      role: tokenRow.role as 'client' | 'freelancer',
      name: dto.name,
      signatureType: dto.signatureType,
      signatureData: dto.signatureData,
    } as RoleSignDto;
    await this.roleSign(c.id, c.user_id, roleDto);
    await (this.prisma as any).contract_sign_tokens.update({
      where: { id: tokenRow.id },
      data: { used_at: new Date() },
    });
    await this.log(c.id, 'public_sign', { role: tokenRow.role }, undefined);
    return { success: true };
  }

  async downloadPdf(id: number, userId: number) {
    await this.assertOwnership(id, userId);
    const contract = await this.prisma.contracts.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contract not found');
    const filename = `contract-${id}.pdf`;
    try {
      const formatted = this.pdfService.formatContractContent(contract.content);
      const html = this.pdfService.renderContractHtml({
        title: contract.title,
        content: formatted,
        meta: {
          status: contract.status,
          value: contract.contract_value
            ? `${String(contract.contract_value)} ${contract.currency || ''}`.trim()
            : undefined,
          start: contract.start_date?.toISOString().split('T')[0],
          end: contract.end_date?.toISOString().split('T')[0],
          signed: contract.signed_date ? 'Yes' : 'No',
        },
        branding: { companyName: 'Craftivo' },
      });
      const buffer = await this.pdfService.generateContractPdfBuffer(
        html,
        contract.title,
      );
      await this.log(id, 'download', undefined, userId);
      return { filename, buffer };
    } catch {
      await this.log(id, 'download', { error: 'pdf_failed' }, userId);
      return { filename, buffer: Buffer.from('PDF generation failed') };
    }
  }

  async findByClient(clientId: number, userId: number) {
    return this.prisma.contracts.findMany({
      where: { client_id: clientId, user_id: userId },
    });
  }

  async findByProject(projectId: number, userId: number) {
    return this.prisma.contracts.findMany({
      where: { project_id: projectId, user_id: userId },
    });
  }

  async findAgentLogs(contractId: number, userId: number) {
    // Ensure the contract belongs to the user
    const contract = await this.prisma.contracts.findFirst({
      where: { id: contractId, user_id: userId },
      select: { id: true },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    return this.prisma.activity_logs.findMany({
      where: {
        entity_type: 'contract',
        entity_id: contractId,
        user_id: userId,
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
