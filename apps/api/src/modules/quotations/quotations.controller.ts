import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';

import { QuotationsService } from './quotations.service';

@ApiBearerAuth()
@ApiTags('quotations')
@Controller('quotations')
export class QuotationsController {
  constructor(private readonly quotationsService: QuotationsService) {}

  @Post()
  async create(@OrgId() orgId: string, @CurrentUser() user: AuthenticatedUser, @Body() body: {
    customerId: string; quotationNumber: string; items: Array<{ description: string; quantity: number; unit: string; unitPrice: number; gstRate: number }>;
    validUntil: string; notes?: string;
  }): ReturnType<QuotationsService['create']> {
    return this.quotationsService.create(orgId, user.id, body);
  }

  @Get()
  async list(@OrgId() orgId: string, @Query('status') status?: string): ReturnType<QuotationsService['list']> {
    return this.quotationsService.list(orgId, status);
  }

  @Post(':id/convert-to-order')
  async convert(@OrgId() orgId: string, @Param('id') id: string, @CurrentUser() user: AuthenticatedUser): ReturnType<QuotationsService['convertToOrder']> {
    return this.quotationsService.convertToOrder(orgId, id, user.id);
  }

  @Post(':id/status')
  async updateStatus(@OrgId() orgId: string, @Param('id') id: string, @Body() body: { status: string }): ReturnType<QuotationsService['updateStatus']> {
    return this.quotationsService.updateStatus(orgId, id, body.status);
  }
}
