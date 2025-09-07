/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { ContractStatus } from '@prisma/client';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  async create(createContractDto: CreateContractDto, userId: number) {
    const {
      start_date,
      end_date,
      template_id,
      client_id,
      project_id,
      ...contractData
    } = createContractDto;

    // Validate template exists if provided
    if (template_id) {
      const templateExists = await this.prisma.contract_templates.findUnique({
        where: { id: template_id },
      });

      if (!templateExists) {
        throw new Error(`Contract template with ID ${template_id} not found`);
      }
    }

    // Validate client exists if provided (remove user_id check if clients table doesn't have it)
    if (client_id) {
      const clientExists = await this.prisma.clients.findUnique({
        where: { id: client_id },
      });

      if (!clientExists) {
        throw new Error(`Client with ID ${client_id} not found`);
      }
    }

    // Validate project exists if provided (remove user_id check if projects table doesn't have it)
    if (project_id) {
      const projectExists = await this.prisma.projects.findUnique({
        where: { id: project_id },
      });

      if (!projectExists) {
        throw new Error(`Project with ID ${project_id} not found`);
      }
    }

    // Build the data object conditionally
    const data: any = {
      ...contractData,
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      user_id: userId,
    };

    // Only include foreign keys if they're provided and valid
    if (template_id) {
      data.template_id = template_id;
    }
    if (client_id) {
      data.client_id = client_id;
    }
    if (project_id) {
      data.project_id = project_id;
    }

    return this.prisma.contracts.create({
      data,
      include: {
        clients: true,
        projects: true,
        contract_templates: true,
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.contracts.findMany({
      where: { user_id: userId },
      include: {
        clients: true,
        projects: true,
        contract_templates: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number, userId: number) {
    return this.prisma.contracts.findFirst({
      where: { id, user_id: userId },
      include: {
        clients: true,
        projects: true,
        contract_templates: true,
      },
    });
  }

  async updateStatus(id: number, status: ContractStatus, userId: number) {
    // First check if contract belongs to user
    const contract = await this.prisma.contracts.findFirst({
      where: { id, user_id: userId },
    });

    if (!contract) {
      throw new Error('Contract not found or access denied');
    }

    return this.prisma.contracts.update({
      where: { id },
      data: {
        status,
        ...(status === 'signed' && { signed_date: new Date() }),
      },
    });
  }

  async findByClient(clientId: number, userId: number) {
    return this.prisma.contracts.findMany({
      where: {
        client_id: clientId,
        user_id: userId,
      },
      include: {
        clients: true,
        projects: true,
        contract_templates: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findByProject(projectId: number, userId: number) {
    return this.prisma.contracts.findMany({
      where: {
        project_id: projectId,
        user_id: userId,
      },
      include: {
        clients: true,
        projects: true,
        contract_templates: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async signContract(
    id: number,
    signature: string,
    signedBy: string,
    userId: number,
  ) {
    // First check if contract belongs to user
    const contract = await this.prisma.contracts.findFirst({
      where: { id, user_id: userId },
    });

    if (!contract) {
      throw new Error('Contract not found or access denied');
    }

    return this.prisma.contracts.update({
      where: { id },
      data: {
        status: 'signed',
        signed_date: new Date(),
        signature_freelancer: signature,
        signed_by_freelancer: signedBy,
      },
    });
  }
}
