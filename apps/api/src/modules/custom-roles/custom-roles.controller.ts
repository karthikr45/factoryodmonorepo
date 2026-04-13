import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { OrgId } from '../../common/decorators/org-id.decorator';

import { CustomRolesService } from './custom-roles.service';

@ApiBearerAuth()
@ApiTags('custom-roles')
@Controller('custom-roles')
export class CustomRolesController {
  constructor(private readonly service: CustomRolesService) {}

  @Post('seed-system-roles')
  async seed(@OrgId() orgId: string): ReturnType<CustomRolesService['seedSystemRoles']> {
    return this.service.seedSystemRoles(orgId);
  }

  @Get('permission-groups')
  getPermissionGroups(): ReturnType<CustomRolesService['listPermissionGroups']> {
    return this.service.listPermissionGroups();
  }

  @Get()
  async list(@OrgId() orgId: string): ReturnType<CustomRolesService['list']> {
    return this.service.list(orgId);
  }

  @Post()
  async create(
    @OrgId() orgId: string,
    @Body() body: Parameters<CustomRolesService['create']>[1],
  ): ReturnType<CustomRolesService['create']> {
    return this.service.create(orgId, body);
  }

  @Put(':id')
  async update(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() body: Parameters<CustomRolesService['update']>[2],
  ): ReturnType<CustomRolesService['update']> {
    return this.service.update(orgId, id, body);
  }

  @Delete(':id')
  async delete(@OrgId() orgId: string, @Param('id') id: string): ReturnType<CustomRolesService['delete']> {
    return this.service.delete(orgId, id);
  }
}
