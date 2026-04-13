import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';

import { WorkflowsService } from './workflows.service';

@ApiBearerAuth()
@ApiTags('workflows')
@Controller('workflows')
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post('seed-system-templates')
  async seedSystem(@OrgId() orgId: string, @CurrentUser() user: AuthenticatedUser): ReturnType<WorkflowsService['seedSystemTemplates']> {
    return this.workflowsService.seedSystemTemplates(orgId, user.id);
  }

  @Get()
  async list(@OrgId() orgId: string): ReturnType<WorkflowsService['list']> {
    return this.workflowsService.list(orgId);
  }

  @Get('default')
  async getDefault(@OrgId() orgId: string): ReturnType<WorkflowsService['getDefault']> {
    return this.workflowsService.getDefault(orgId);
  }

  @Get(':id')
  async get(@OrgId() orgId: string, @Param('id') id: string): ReturnType<WorkflowsService['get']> {
    return this.workflowsService.get(orgId, id);
  }

  @Post()
  async create(
    @OrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: Parameters<WorkflowsService['create']>[2],
  ): ReturnType<WorkflowsService['create']> {
    return this.workflowsService.create(orgId, user.id, body);
  }

  @Put(':id')
  async update(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() body: Parameters<WorkflowsService['update']>[2],
  ): ReturnType<WorkflowsService['update']> {
    return this.workflowsService.update(orgId, id, body);
  }

  @Delete(':id')
  async delete(@OrgId() orgId: string, @Param('id') id: string): ReturnType<WorkflowsService['delete']> {
    return this.workflowsService.delete(orgId, id);
  }

  @Post(':id/set-default')
  async setDefault(@OrgId() orgId: string, @Param('id') id: string): ReturnType<WorkflowsService['setDefault']> {
    return this.workflowsService.setDefault(orgId, id);
  }
}
