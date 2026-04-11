import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import type {
  InviteMemberInput,
  OnboardOrganisationInput,
  UpdateOrganisationInput,
} from '@repo/validators';

import { AccountingService } from '../../common/accounting/accounting.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class OrganisationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounting: AccountingService,
  ) {}

  /**
   * First-time onboarding: user has just verified their phone and is now giving
   * us their company details. We rename their placeholder org, activate it, and
   * — for FACTORY orgs — seed a default chart of accounts.
   */
  async onboard(
    userId: string,
    orgId: string,
    input: OnboardOrganisationInput,
  ): Promise<{ id: string; name: string; type: string }> {
    const org = await this.prisma.client.organisation.update({
      where: { id: orgId },
      data: {
        name: input.name,
        gstin: input.gstin ?? null,
        type: input.type,
        isActive: true,
      },
    });

    await this.prisma.client.user.update({
      where: { id: userId },
      data: {
        name: input.ownerName,
        role:
          input.type === 'AGENCY'
            ? 'AGENCY_ADMIN'
            : input.type === 'CA_FIRM'
              ? 'CA'
              : 'OWNER',
      },
    });

    if (input.type === 'FACTORY') {
      await this.accounting.seedChartOfAccounts(orgId);
      await this.seedDefaultDepartments(orgId);
    }

    return { id: org.id, name: org.name, type: org.type };
  }

  async getCurrent(orgId: string): Promise<{
    id: string;
    name: string;
    gstin: string | null;
    type: string;
    plan: string;
    isActive: boolean;
    memberCount: number;
  }> {
    const org = await this.prisma.client.organisation.findUnique({
      where: { id: orgId },
      include: { _count: { select: { users: true } } },
    });
    if (!org) throw new NotFoundException('Organisation not found');
    return {
      id: org.id,
      name: org.name,
      gstin: org.gstin,
      type: org.type,
      plan: org.plan,
      isActive: org.isActive,
      memberCount: org._count.users,
    };
  }

  async update(
    orgId: string,
    input: UpdateOrganisationInput,
  ): Promise<{ id: string; name: string }> {
    const updated = await this.prisma.client.organisation.update({
      where: { id: orgId },
      data: input,
    });
    return { id: updated.id, name: updated.name };
  }

  async listMembers(orgId: string): Promise<
    Array<{
      id: string;
      name: string;
      phone: string;
      email: string | null;
      role: string;
      isActive: boolean;
      lastLogin: Date | null;
    }>
  > {
    const users = await this.prisma.client.user.findMany({
      where: { orgId },
      orderBy: { createdAt: 'asc' },
    });
    return users.map((u) => ({
      id: u.id,
      name: u.name,
      phone: u.phone,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      lastLogin: u.lastLogin,
    }));
  }

  async inviteMember(
    orgId: string,
    input: InviteMemberInput,
  ): Promise<{ id: string; name: string; phone: string; role: string }> {
    const existing = await this.prisma.client.user.findUnique({
      where: { phone: input.phone },
    });
    if (existing) {
      throw new ConflictException('A user with this phone number already exists');
    }
    const user = await this.prisma.client.user.create({
      data: {
        orgId,
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        role: input.role,
      },
    });
    return { id: user.id, name: user.name, phone: user.phone, role: user.role };
  }

  async deactivateMember(orgId: string, userId: string): Promise<{ ok: true }> {
    const user = await this.prisma.client.user.findFirst({ where: { id: userId, orgId } });
    if (!user) throw new NotFoundException('Member not found');
    await this.prisma.client.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
    return { ok: true };
  }

  /**
   * Seed the default department pipeline for a new factory.
   */
  private async seedDefaultDepartments(orgId: string): Promise<void> {
    const defaults = [
      { name: 'Cutting', sequence: 1 },
      { name: 'Machining', sequence: 2 },
      { name: 'Assembly', sequence: 3 },
      { name: 'Quality Check', sequence: 4 },
      { name: 'Packing', sequence: 5 },
      { name: 'Dispatch', sequence: 6 },
    ];
    for (const dept of defaults) {
      await this.prisma.client.department.create({
        data: { ...dept, orgId, isActive: true },
      });
    }
  }
}
