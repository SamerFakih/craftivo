/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(createInvoiceDto: CreateInvoiceDto, userId: number) {
    const { items, issue_date, due_date, status, ...invoiceData } =
      createInvoiceDto;

    return this.prisma.invoices.create({
      data: {
        ...invoiceData,
        issue_date: new Date(issue_date),
        due_date: new Date(due_date),
        status: status ? (status.toLowerCase() as InvoiceStatus) : 'pending',
        user_id: userId,
        invoice_items: {
          create: items.map((item) => ({
            ...item,
            total_amount: item.quantity * item.unit_price,
          })),
        },
      },
      include: {
        invoice_items: true,
        clients: true,
        projects: true,
      },
    });
  }

  async findAll(userId: number) {
    return this.prisma.invoices.findMany({
      where: { user_id: userId },
      include: {
        invoice_items: true,
        clients: true,
        projects: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: number, userId: number) {
    return this.prisma.invoices.findFirst({
      where: { id, user_id: userId },
      include: {
        invoice_items: true,
        clients: true,
        projects: true,
      },
    });
  }

  async updateStatus(id: number, status: InvoiceStatus, userId: number) {
    return this.prisma.invoices.update({
      where: { id },
      data: {
        status,
        ...(status === 'paid' && { paid_date: new Date() }),
      },
    });
  }

  async getInvoicesByProject(projectId: number, userId: number) {
    return this.prisma.invoices.findMany({
      where: { project_id: projectId, user_id: userId },
      include: { invoice_items: true },
    });
  }
}
