/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async create(createInvoiceDto: CreateInvoiceDto, userId: number) {
    const {
      items,
      issue_date,
      due_date,
      status,
      tax_rate = 0,
      discount_amount = 0,
      invoice_number,
      ...invoiceData
    } = createInvoiceDto;

    const generatedInvoiceNumber = invoice_number || `INV-${Date.now()}`;
    // Calculate subtotal from items
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
      0,
    );
    const taxAmount = subtotal * Number(tax_rate);
    const total = subtotal + taxAmount - Number(discount_amount || 0);
    console.log({ 'invoice items': items, subtotal, taxAmount, total });
    return this.prisma.invoices.create({
      data: {
        ...invoiceData,
        invoice_number: generatedInvoiceNumber,
        issue_date: new Date(issue_date),
        due_date: new Date(due_date),
        status: status ? (status.toLowerCase() as InvoiceStatus) : 'pending',
        user_id: userId,
        subtotal: subtotal.toString(),
        tax_rate: tax_rate.toString(),
        tax_amount: taxAmount.toString(),
        discount_amount: discount_amount?.toString() ?? '0',
        total_amount: total.toString(),
        invoice_items: {
          create: items.map(({ id, ...item }) => ({
            ...item,
            quantity: item.quantity.toString(),
            unit_price: item.unit_price.toString(),
            total_amount: (
              Number(item.quantity) * Number(item.unit_price)
            ).toString(),
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
    const invoices = await this.prisma.invoices.findMany({
      where: { user_id: userId },
      include: {
        invoice_items: true,
        clients: true,
        projects: true,
      },
      orderBy: { created_at: 'desc' },
    });
    return invoices.map((inv) => ({
      id: inv.invoice_number,
      client: inv.clients?.name || '',
      project: inv.projects?.name || '',
      amountUSD: Number(inv.total_amount),
      issuedISO: inv.issue_date
        ? inv.issue_date.toISOString().slice(0, 10)
        : '',
      dueISO: inv.due_date ? inv.due_date.toISOString().slice(0, 10) : '',
      paidISO: inv.paid_date ? inv.paid_date.toISOString().slice(0, 10) : '',
      status: inv.status,
      currency: inv.currency || 'USD',
    }));
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
