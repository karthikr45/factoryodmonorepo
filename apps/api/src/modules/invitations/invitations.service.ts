import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

const ONE_WEEK_MS = 7 * 86_400_000;

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly whatsapp: WhatsAppService,
  ) {}

  /**
   * Invite a colleague to join your organisation.
   * Sends a WhatsApp/SMS with a signup link containing the invitation token.
   */
  async inviteTeamMember(orgId: string, inviterId: string, input: {
    name: string; phone: string; role: string;
  }): Promise<{ id: string; token: string }> {
    const existing = await this.prisma.client.user.findUnique({ where: { phone: input.phone } });
    if (existing) {
      throw new BadRequestException(`This phone number is already registered to ${existing.name}`);
    }

    const inv = await this.prisma.client.invitation.create({
      data: {
        orgId, invitedBy: inviterId, type: 'TEAM_MEMBER',
        inviteePhone: input.phone, inviteeName: input.name,
        inviteeRole: input.role as never,
        expiresAt: new Date(Date.now() + ONE_WEEK_MS),
      },
    });

    const org = await this.prisma.client.organisation.findUnique({ where: { id: orgId } });
    const link = `${process.env.NEXT_PUBLIC_API_URL?.replace(':4000', ':3000') ?? 'http://localhost:3000'}/signup?token=${inv.token}`;
    await this.whatsapp.sendText(
      orgId, input.phone,
      `Hi ${input.name}! ${org?.name ?? 'Your team'} has invited you to join FactoryOS as a ${input.role}. Sign up here: ${link}`,
    );

    return { id: inv.id, token: inv.token };
  }

  /**
   * Invite another business (CA firm, staffing agency) to connect.
   * If they're already on FactoryOS, it becomes a relationship request.
   * If not, it's an invitation to sign up.
   */
  async inviteOrganisation(orgId: string, inviterId: string, input: {
    targetOrgName: string; targetGstin?: string; targetPhone: string;
    targetOrgType: string; relationshipType: string;
  }): Promise<{ id: string; alreadyOnPlatform: boolean }> {
    // Check if the target org is already on the platform
    const existingOrg = input.targetGstin
      ? await this.prisma.client.organisation.findUnique({ where: { gstin: input.targetGstin } })
      : null;

    if (existingOrg) {
      // Create a relationship request directly
      await this.prisma.client.orgRelationship.upsert({
        where: {
          fromOrgId_toOrgId_type: {
            fromOrgId: orgId, toOrgId: existingOrg.id,
            type: input.relationshipType as never,
          },
        },
        update: {},
        create: {
          fromOrgId: orgId, toOrgId: existingOrg.id,
          type: input.relationshipType as never,
          status: 'PENDING', invitedBy: inviterId,
        },
      });

      // Notify the target org
      await this.notifications.notifyOrg({
        orgId: existingOrg.id, type: 'GENERIC',
        title: 'New connection request',
        body: `${input.targetOrgName} wants to connect with you as a ${input.relationshipType.replace('_', ' ')}`,
        metadata: { fromOrgId: orgId },
      });

      return { id: orgId, alreadyOnPlatform: true };
    }

    // Otherwise, create an invitation
    const inv = await this.prisma.client.invitation.create({
      data: {
        orgId, invitedBy: inviterId, type: 'ORG_RELATIONSHIP',
        targetOrgType: input.targetOrgType as never,
        targetOrgName: input.targetOrgName,
        targetGstin: input.targetGstin ?? null,
        targetPhone: input.targetPhone,
        relationshipType: input.relationshipType as never,
        expiresAt: new Date(Date.now() + ONE_WEEK_MS),
      },
    });

    const org = await this.prisma.client.organisation.findUnique({ where: { id: orgId } });
    const link = `${process.env.NEXT_PUBLIC_API_URL?.replace(':4000', ':3000') ?? 'http://localhost:3000'}/signup?token=${inv.token}`;
    await this.whatsapp.sendText(
      orgId, input.targetPhone,
      `Hi! ${org?.name ?? 'A business'} has invited your ${input.targetOrgType.toLowerCase()} to collaborate on FactoryOS — a platform that connects factories, staffing agencies, and CAs. Sign up free: ${link}`,
    );

    return { id: inv.id, alreadyOnPlatform: false };
  }

  async listMyInvitations(orgId: string): Promise<Array<{
    id: string; type: string; status: string; inviteeName: string | null;
    inviteePhone: string | null; targetOrgName: string | null;
    createdAt: Date; expiresAt: Date;
  }>> {
    return this.prisma.client.invitation.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    }).then((rows) => rows.map((r) => ({
      id: r.id, type: r.type, status: r.status,
      inviteeName: r.inviteeName, inviteePhone: r.inviteePhone,
      targetOrgName: r.targetOrgName, createdAt: r.createdAt, expiresAt: r.expiresAt,
    })));
  }

  /**
   * Consume an invitation token during signup.
   * Called from the signup flow — creates the User record and marks invite as accepted.
   */
  async acceptInvitation(token: string, userId: string): Promise<{ orgId: string; role: string }> {
    const inv = await this.prisma.client.invitation.findUnique({ where: { token } });
    if (!inv) throw new NotFoundException('Invitation not found');
    if (inv.status !== 'PENDING') throw new BadRequestException('Invitation already used or revoked');
    if (inv.expiresAt < new Date()) {
      await this.prisma.client.invitation.update({
        where: { id: inv.id }, data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Invitation has expired');
    }

    if (inv.type === 'TEAM_MEMBER') {
      // Move the (just-created) user into the inviting org with the specified role
      await this.prisma.client.user.update({
        where: { id: userId },
        data: {
          orgId: inv.orgId,
          role: (inv.inviteeRole ?? 'WORKER') as never,
          name: inv.inviteeName ?? undefined,
        },
      });
    }

    await this.prisma.client.invitation.update({
      where: { id: inv.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date(), acceptedBy: userId },
    });

    return { orgId: inv.orgId, role: inv.inviteeRole ?? 'WORKER' };
  }

  async revoke(orgId: string, id: string): Promise<{ ok: true }> {
    const inv = await this.prisma.client.invitation.findFirst({ where: { id, orgId } });
    if (!inv) throw new NotFoundException('Invitation not found');
    await this.prisma.client.invitation.update({
      where: { id }, data: { status: 'REVOKED' },
    });
    return { ok: true };
  }
}
