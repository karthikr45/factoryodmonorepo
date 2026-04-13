import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';

import { ApprovalsService } from './approvals.service';

@ApiBearerAuth()
@ApiTags('approvals')
@Controller('approvals')
export class ApprovalsController {
  constructor(private readonly service: ApprovalsService) {}

  @Get('rules')
  async listRules(@OrgId() orgId: string): ReturnType<ApprovalsService['listRules']> {
    return this.service.listRules(orgId);
  }

  @Post('rules')
  async createRule(
    @OrgId() orgId: string,
    @Body() body: Parameters<ApprovalsService['createRule']>[1],
  ): ReturnType<ApprovalsService['createRule']> {
    return this.service.createRule(orgId, body);
  }

  @Put('rules/:id')
  async updateRule(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() body: Parameters<ApprovalsService['updateRule']>[2],
  ): ReturnType<ApprovalsService['updateRule']> {
    return this.service.updateRule(orgId, id, body);
  }

  @Delete('rules/:id')
  async deleteRule(@OrgId() orgId: string, @Param('id') id: string): ReturnType<ApprovalsService['deleteRule']> {
    return this.service.deleteRule(orgId, id);
  }

  @Get('simulate')
  async simulate(
    @OrgId() orgId: string,
    @Query('triggerType') triggerType: string,
    @Query('value') value: string,
  ): ReturnType<ApprovalsService['simulate']> {
    return this.service.simulate(orgId, triggerType, Number(value ?? 0));
  }

  @Get('pending')
  async listPending(@OrgId() orgId: string): ReturnType<ApprovalsService['listPending']> {
    return this.service.listPending(orgId);
  }

  @Post(':id/act')
  async act(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { action: 'APPROVE' | 'REJECT'; notes?: string },
  ): ReturnType<ApprovalsService['act']> {
    return this.service.act(orgId, id, user.id, body.action, body.notes);
  }
}
