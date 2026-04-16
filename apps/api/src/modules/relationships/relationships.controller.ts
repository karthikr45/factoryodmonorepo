import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { OrgId } from '../../common/decorators/org-id.decorator';

import { RelationshipsService } from './relationships.service';

@ApiBearerAuth()
@ApiTags('relationships')
@Controller('relationships')
export class RelationshipsController {
  constructor(private readonly relationshipsService: RelationshipsService) {}

  @Get()
  async listPartners(@OrgId() orgId: string): ReturnType<RelationshipsService['listPartners']> {
    return this.relationshipsService.listPartners(orgId);
  }

  @Post(':id/accept')
  async accept(@OrgId() orgId: string, @Param('id') id: string): ReturnType<RelationshipsService['acceptRequest']> {
    return this.relationshipsService.acceptRequest(orgId, id);
  }

  @Post(':id/reject')
  async reject(@OrgId() orgId: string, @Param('id') id: string): ReturnType<RelationshipsService['rejectRequest']> {
    return this.relationshipsService.rejectRequest(orgId, id);
  }

  @Post(':id/end')
  async end(@OrgId() orgId: string, @Param('id') id: string): ReturnType<RelationshipsService['endRelationship']> {
    return this.relationshipsService.endRelationship(orgId, id);
  }

  @Get('search')
  async search(@OrgId() orgId: string, @Query('q') q: string): ReturnType<RelationshipsService['searchOrganisations']> {
    return this.relationshipsService.searchOrganisations(q, orgId);
  }

  @Get('ca/clients')
  async caClients(@OrgId() orgId: string): ReturnType<RelationshipsService['caClients']> {
    return this.relationshipsService.caClients(orgId);
  }
}
