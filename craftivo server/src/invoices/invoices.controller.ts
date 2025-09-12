/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { AuthGuard } from '@nestjs/passport';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(AuthGuard('jwt'))
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create invoice' })
  @ApiBody({ type: CreateInvoiceDto })
  @ApiResponse({
    status: 201,
    description: 'The invoice has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createInvoiceDto: CreateInvoiceDto, @Request() req) {
    return this.invoicesService.create(createInvoiceDto, req.user.user_id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  @ApiResponse({
    status: 200,
    description: 'List of all invoices',
  })
  findAll(@Request() req) {
    return this.invoicesService.findAll(req.user.user_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiParam({ name: 'id', type: 'number', description: 'Invoice ID' })
  @ApiResponse({
    status: 200,
    description: 'The invoice has been successfully retrieved.',
  })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.invoicesService.findOne(id, req.user.user_id);
  }

  @Patch(':id/status')
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
    @Request() req,
  ) {
    return this.invoicesService.updateStatus(
      id,
      updateStatusDto.status,
      req.user.user_id,
    );
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get invoices by project ID' })
  @ApiParam({ name: 'projectId', type: 'number', description: 'Project ID' })
  @ApiResponse({
    status: 200,
    description: 'List of invoices for the specified project',
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  getByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Request() req,
  ) {
    return this.invoicesService.getInvoicesByProject(
      projectId,
      req.user.user_id,
    );
  }
}
