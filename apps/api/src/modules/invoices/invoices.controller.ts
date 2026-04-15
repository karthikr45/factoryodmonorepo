import { Body, Controller, Get, Header, Param, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

import { InvoicesService } from './invoices.service';

@ApiBearerAuth()
@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @RequirePermissions('invoices.create')
  async create(@OrgId() orgId: string, @CurrentUser() user: AuthenticatedUser, @Body() body: {
    orderId?: string; customerId: string; invoiceNumber: string;
    invoiceDate: string; dueDate?: string; items: Array<{
      description: string; quantity: number; unit: string; unitPrice: number; gstRate: number; hsnCode?: string;
    }>; notes?: string;
  }): ReturnType<InvoicesService['create']> {
    return this.invoicesService.create(orgId, user.id, body);
  }

  @Get()
  async list(@OrgId() orgId: string, @Query('status') status?: string): ReturnType<InvoicesService['list']> {
    return this.invoicesService.list(orgId, status);
  }

  @Get(':id')
  async get(@OrgId() orgId: string, @Param('id') id: string): ReturnType<InvoicesService['get']> {
    return this.invoicesService.get(orgId, id);
  }

  @Post(':id/payment')
  @RequirePermissions('payments.record')
  async recordPayment(@OrgId() orgId: string, @Param('id') id: string, @Body() body: { amountPaise: number }): ReturnType<InvoicesService['recordPayment']> {
    return this.invoicesService.recordPayment(orgId, id, body.amountPaise);
  }

  @Get(':id/pdf')
  @RequirePermissions('invoices.view')
  @Header('Content-Type', 'application/pdf')
  async getPdf(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, filename } = await this.invoicesService.getPdf(orgId, id);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', String(buffer.length));
    res.end(buffer);
  }
}
