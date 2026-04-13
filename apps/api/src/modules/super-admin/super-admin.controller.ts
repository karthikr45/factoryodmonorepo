import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';

import { SuperAdminService } from './super-admin.service';

@ApiBearerAuth()
@ApiTags('super-admin')
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('stats')
  async stats(@CurrentUser() user: AuthenticatedUser): ReturnType<SuperAdminService['platformStats']> {
    await this.superAdminService.assertSuperAdmin(user.id);
    return this.superAdminService.platformStats();
  }

  @Get('organisations')
  async listOrgs(@CurrentUser() user: AuthenticatedUser): ReturnType<SuperAdminService['listAllOrganisations']> {
    await this.superAdminService.assertSuperAdmin(user.id);
    return this.superAdminService.listAllOrganisations();
  }

  @Post('organisations/:id/toggle-active')
  async toggleActive(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): ReturnType<SuperAdminService['toggleOrgActive']> {
    await this.superAdminService.assertSuperAdmin(user.id);
    return this.superAdminService.toggleOrgActive(id);
  }

  @Post('organisations/:id/plan')
  async setPlan(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: { plan: string }): ReturnType<SuperAdminService['setPlan']> {
    await this.superAdminService.assertSuperAdmin(user.id);
    return this.superAdminService.setPlan(id, body.plan);
  }
}
