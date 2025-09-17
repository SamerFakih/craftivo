import { Injectable, NotFoundException } from '@nestjs/common';
import { parseDate } from '../common/utils/date.util';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { ContractStatus } from '@prisma/client';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.contracts.create({
      data: payload,
    });
  }

  async findAll(userId: number) {
    return this.prisma.contracts.findMany({
      where: { user_id: userId },
      include: { clients: true, projects: true },
    });
  }

  async findOne(id: number, userId: number) {
    const contract = await this.prisma.contracts.findFirst({
      where: { id, user_id: userId },
      include: { clients: true, projects: true },
    });
    if (!contract) {
      throw new NotFoundException('Contract not found');
    }
    return contract;
  }

  async updateStatus(id: number, status: ContractStatus) {
    return this.prisma.contracts.update({
      where: { id },
      data: { status },
    });
  }

  async signContract(id: number, signature: string, signedBy: string) {
    return this.prisma.contracts.update({
      where: { id },
      data: {
        status: ContractStatus.signed,
        signed_date: new Date(),
        signed_by_client: signedBy,
        signature_client: signature,
      },
    });
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
