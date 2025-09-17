import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { IngestEmailInvoiceDto } from './dto/ingest-email-invoice.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UserId } from '../common/decorators/user-id.decorator';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create invoice' })
  @ApiBody({ type: CreateInvoiceDto })
  @ApiResponse({
    status: 201,
    description: 'The invoice has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createInvoiceDto: CreateInvoiceDto, @UserId() userId: number) {
    return this.invoicesService.create(createInvoiceDto, userId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiResponse({
    status: 200,
    description: 'List of all invoices',
  })
  findAll(@UserId() userId: number) {
    return this.invoicesService.findAll(userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Invoice ID' })
  @ApiResponse({
    status: 200,
    description: 'The invoice has been successfully retrieved.',
  })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  findOne(@Param('id', ParseIntPipe) id: number, @UserId() userId: number) {
    return this.invoicesService.findOne(id, userId);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update invoice status' })
  @ApiParam({ name: 'id', type: 'number', description: 'Invoice ID' })
  @ApiBody({ type: UpdateStatusDto })
  @ApiResponse({
    status: 200,
    description: 'The invoice status has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateStatusDto,
    @UserId() userId: number,
  ) {
    return this.invoicesService.updateStatus(
      id,
      updateStatusDto.status,
      userId,
    );
  }

  @Get('project/:projectId')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get invoices by project ID' })
  @ApiParam({ name: 'projectId', type: 'number', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'List of invoices for the specified project',
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  getByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @UserId() userId: number,
  ) {
    return this.invoicesService.getInvoicesByProject(projectId, userId);
  }

  @Post('ingest-email')
  @UseGuards(ApiKeyGuard)
  @Throttle({ default: { limit: 300, ttl: 60000 } })
  @ApiOperation({ summary: 'Ingest an invoice parsed from email (automation)' })
  @ApiBody({ type: IngestEmailInvoiceDto })
  @ApiResponse({ status: 201, description: 'Invoice ingested.' })
  @ApiResponse({
    status: 400,
    description: 'Bad payload / unable to resolve client or project.',
  })
  @ApiHeader({
    name: 'x-api-key',
    required: true,
    description: 'Ingest API key',
  })
  ingestEmail(
    @Body() ingestDto: IngestEmailInvoiceDto,
    @UserId() userId: number,
  ) {
    return this.invoicesService.ingestFromEmail(ingestDto, userId);
  }
}
