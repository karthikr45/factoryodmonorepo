import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';
import { Public } from '../../common/decorators/public.decorator';

import { InvitationsService } from './invitations.service';

@ApiBearerAuth()
@ApiTags('invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('team')
  async inviteTeam(
    @OrgId() orgId: string, @CurrentUser() user: AuthenticatedUser,
    @Body() body: { name: string; phone: string; role: string },
  ): ReturnType<InvitationsService['inviteTeamMember']> {
    return this.invitationsService.inviteTeamMember(orgId, user.id, body);
  }

  @Post('organisation')
  async inviteOrg(
    @OrgId() orgId: string, @CurrentUser() user: AuthenticatedUser,
    @Body() body: {
      targetOrgName: string; targetGstin?: string; targetPhone: string;
      targetOrgType: string; relationshipType: string;
    },
  ): ReturnType<InvitationsService['inviteOrganisation']> {
    return this.invitationsService.inviteOrganisation(orgId, user.id, body);
  }

  @Get()
  async listMy(@OrgId() orgId: string): ReturnType<InvitationsService['listMyInvitations']> {
    return this.invitationsService.listMyInvitations(orgId);
  }

  @Public()
  @Post('accept')
  async accept(@Body() body: { token: string; userId: string }): ReturnType<InvitationsService['acceptInvitation']> {
    return this.invitationsService.acceptInvitation(body.token, body.userId);
  }

  @Delete(':id')
  async revoke(@OrgId() orgId: string, @Param('id') id: string): ReturnType<InvitationsService['revoke']> {
    return this.invitationsService.revoke(orgId, id);
  }
}
