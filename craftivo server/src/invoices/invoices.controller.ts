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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
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

  @ApiOperation({ summary: 'Create invoice' })
  @ApiResponse({
    status: 201,
    description: 'The invoice has been successfully created.',
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @Post()
  create(@Body() createInvoiceDto: CreateInvoiceDto, @Request() req) {
    return this.invoicesService.create(createInvoiceDto, req.user.userId);
  }

  @ApiOperation({ summary: 'Get all invoices' })
  @ApiResponse({
    status: 200,
    description: 'List of all invoices',
  })
  @Get()
  findAll(@Request() req) {
    return this.invoicesService.findAll(req.user.userId);
  }

  @ApiOperation({ summary: 'Get invoice by ID' })
  @ApiResponse({
    status: 200,
    description: 'The invoice has been successfully retrieved.',
  })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.invoicesService.findOne(+id, req.user.userId);
  }

  @ApiOperation({ summary: 'Update invoice status' })
  @ApiResponse({
    status: 200,
    description: 'The invoice status has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Invoice not found.' })
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
    @Request() req,
  ) {
    return this.invoicesService.updateStatus(
      +id,
      updateStatusDto.status,
      req.user.userId,
    );
  }

  @ApiOperation({ summary: 'Get invoices by project ID' })
  @ApiResponse({
    status: 200,
    description: 'List of invoices for the specified project',
  })
  @ApiResponse({ status: 404, description: 'Project not found.' })
  @Get('project/:projectId')
  getByProject(@Param('projectId') projectId: string, @Request() req) {
    return this.invoicesService.getInvoicesByProject(
      +projectId,
      req.user.userId,
    );
  }
}
