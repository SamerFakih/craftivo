import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInvoiceDto,
  CreateInvoiceItemDto,
} from './dto/create-invoice.dto';
import { InvoiceStatus } from '@prisma/client';
import { IngestEmailInvoiceDto } from './dto/ingest-email-invoice.dto';

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
    try {
      return await this.prisma.invoices.create({
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
            create: items.map((item) => ({
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
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'P2002') {
        // Unique constraint violation on invoice_number
        const existing = await this.prisma.invoices.findFirst({
          where: { invoice_number: generatedInvoiceNumber, user_id: userId },
          include: { invoice_items: true, clients: true, projects: true },
        });
        if (existing) return existing;

        // If conflict is global (another user), retry with suffixed number once
        const retryNumber = `${generatedInvoiceNumber}-${Date.now()}`;
        return await this.prisma.invoices.create({
          data: {
            ...invoiceData,
            invoice_number: retryNumber,
            issue_date: new Date(issue_date),
            due_date: new Date(due_date),
            status: status
              ? (status.toLowerCase() as InvoiceStatus)
              : 'pending',
            user_id: userId,
            subtotal: subtotal.toString(),
            tax_rate: tax_rate.toString(),
            tax_amount: taxAmount.toString(),
            discount_amount: discount_amount?.toString() ?? '0',
            total_amount: total.toString(),
            invoice_items: {
              create: items.map((item) => ({
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
      throw err;
    }
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
    // Ensure invoice belongs to the user before updating (prevents horizontal privilege issues)
    const existing = await this.prisma.invoices.findFirst({
      where: { id, user_id: userId },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException('Invoice not found');
    }
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

  /**
   * Ingest invoice coming from email automation (n8n).
   * Flexible identification rules:
   * - If project_id provided, use it and derive client_id from project if missing
   * - Else if client_id provided, attach invoice directly to client
   * - Else if clientEmail provided: try find existing client by email (case-insensitive)
   *   - If not found, create a minimal client (requires clientName or email local-part fallback)
   * - Optionally try to match projectName (owned by user) if provided and set project_id
   */
  // Ingest invoice from email automation (idempotent, flexible identification)
  async ingestFromEmail(dto: IngestEmailInvoiceDto, userId: number) {
    const {
      client_id,
      clientEmail,
      clientName,
      project_id,
      projectName,
      items = [],
      invoice_number,
      issue_date,
      due_date,
      tax_rate = 0,
      discount_amount = 0,
      currency = 'USD',
      payment_terms,
      notes,
    } = dto;

    let resolvedProjectId: number | undefined = project_id;
    let resolvedClientId: number | undefined = client_id;

    // Derive client from project if only project_id provided
    if (resolvedProjectId && !resolvedClientId) {
      const proj = await this.prisma.projects.findFirst({
        where: { id: resolvedProjectId, owner_id: userId },
        select: { client_id: true },
      });
      if (!proj)
        throw new BadRequestException('Project not found or not owned by user');
      resolvedClientId = proj.client_id ?? resolvedClientId;
    }

    // Resolve or create client by email
    if (!resolvedClientId && clientEmail) {
      let client = await this.prisma.clients.findFirst({
        where: { email: clientEmail.toLowerCase(), created_by: userId },
        select: { id: true },
      });
      if (!client) {
        const nameFromEmail = clientName || clientEmail.split('@')[0];
        client = await this.prisma.clients.create({
          data: {
            name: nameFromEmail,
            email: clientEmail.toLowerCase(),
            created_by: userId,
            active: true,
          },
          select: { id: true },
        });
      }
      resolvedClientId = client.id;
    }

    // Match project by name if needed
    if (!resolvedProjectId && projectName) {
      const proj = await this.prisma.projects.findFirst({
        where: { name: projectName, owner_id: userId, active: true },
        select: { id: true, client_id: true },
      });
      if (proj) {
        resolvedProjectId = proj.id;
        if (!resolvedClientId)
          resolvedClientId = proj.client_id ?? resolvedClientId;
      }
    }

    // Guard: must resolve at least one context
    if (!resolvedClientId && !resolvedProjectId) {
      throw new BadRequestException('Unable to resolve client or project');
    }

    // Build create DTO shape (fallback single line item if none supplied)
    const normalizedItems: CreateInvoiceItemDto[] = items?.length
      ? items
      : [
          {
            id: 1,
            description: notes || 'Services',
            quantity: 1,
            unit_price: 0,
          },
        ];

    let finalInvoiceNumber = invoice_number || `INV-${Date.now()}`;

    // Idempotency: if same invoice_number already exists for user return it
    if (invoice_number) {
      const existing = await this.prisma.invoices.findFirst({
        where: { invoice_number, user_id: userId },
        include: { invoice_items: true, clients: true, projects: true },
      });
      if (existing) {
        return existing;
      }
      // Global collision (another user) -> suffix
      const existsAny = await this.prisma.invoices.findFirst({
        where: { invoice_number },
        select: { id: true },
      });
      if (existsAny) {
        finalInvoiceNumber = `${invoice_number}-${Date.now()}`;
      }
    }

    const createDto: CreateInvoiceDto = {
      invoice_number: finalInvoiceNumber,
      client_id: resolvedClientId,
      project_id: resolvedProjectId,
      issue_date,
      due_date,
      status: 'pending',
      tax_rate,
      discount_amount,
      currency,
      payment_terms,
      notes,
      items: normalizedItems,
    } as CreateInvoiceDto;

    return this.create(createDto, userId);
  }
}
