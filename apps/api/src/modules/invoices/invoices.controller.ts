import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';

import { InvoicesService } from './invoices.service';

@ApiBearerAuth()
@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
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
  async recordPayment(@OrgId() orgId: string, @Param('id') id: string, @Body() body: { amountPaise: number }): ReturnType<InvoicesService['recordPayment']> {
    return this.invoicesService.recordPayment(orgId, id, body.amountPaise);
  }
}
