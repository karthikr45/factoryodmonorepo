import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { OrgId } from '../../common/decorators/org-id.decorator';

import { TransportService } from './transport.service';

@ApiBearerAuth()
@ApiTags('transport')
@Controller('transport')
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Get('transporters')
  async listTransporters(@OrgId() orgId: string): ReturnType<TransportService['listTransporters']> {
    return this.transportService.listTransporters(orgId);
  }

  @Post('transporters')
  async createTransporter(@OrgId() orgId: string, @Body() body: {
    name: string; phone: string; vehicleNumber?: string; vehicleType?: string;
  }): ReturnType<TransportService['createTransporter']> {
    return this.transportService.createTransporter(orgId, body);
  }

  @Post('dispatches')
  async createDispatch(@OrgId() orgId: string, @Body() body: {
    orderId: string; transporterId?: string; vehicleNumber?: string;
    driverName?: string; driverPhone?: string; ewayBillNumber?: string;
    expectedDeliveryDate?: string; freightCostRupees?: number; notes?: string;
  }): ReturnType<TransportService['createDispatch']> {
    return this.transportService.createDispatch(orgId, body);
  }

  @Post('dispatches/:id/delivered')
  async markDelivered(@OrgId() orgId: string, @Param('id') id: string, @Body() body: { proofUrl?: string }): ReturnType<TransportService['markDelivered']> {
    return this.transportService.markDelivered(orgId, id, body.proofUrl);
  }

  @Get('dispatches')
  async listDispatches(@OrgId() orgId: string, @Query('status') status?: string): ReturnType<TransportService['listDispatches']> {
    return this.transportService.listDispatches(orgId, status);
  }
}
