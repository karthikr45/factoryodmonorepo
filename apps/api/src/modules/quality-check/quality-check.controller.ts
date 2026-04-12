import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';

import { QualityCheckService } from './quality-check.service';

@ApiBearerAuth()
@ApiTags('quality-check')
@Controller('quality-check')
export class QualityCheckController {
  constructor(private readonly qcService: QualityCheckService) {}

  @Post()
  async create(@OrgId() orgId: string, @CurrentUser() user: AuthenticatedUser, @Body() body: {
    orderId?: string; jobCardId?: string; checklistItems: Array<{ parameter: string; expected: string; actual: string; passed: boolean }>;
  }): ReturnType<QualityCheckService['create']> {
    return this.qcService.create(orgId, user.id, body);
  }

  @Post(':id/status')
  async updateStatus(@OrgId() orgId: string, @Param('id') id: string, @CurrentUser() user: AuthenticatedUser, @Body() body: {
    status: string; defectNotes?: string;
  }): ReturnType<QualityCheckService['updateStatus']> {
    return this.qcService.updateStatus(orgId, id, user.id, body);
  }

  @Get()
  async list(@OrgId() orgId: string, @Query('status') status?: string): ReturnType<QualityCheckService['list']> {
    return this.qcService.list(orgId, status);
  }

  @Get('order/:orderId')
  async byOrder(@OrgId() orgId: string, @Param('orderId') orderId: string): ReturnType<QualityCheckService['listByOrder']> {
    return this.qcService.listByOrder(orgId, orderId);
  }
}
