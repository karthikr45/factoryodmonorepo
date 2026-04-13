import { ForbiddenException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SuperAdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verify that the user is a super admin — throws if not.
   * Super admins belong to the PLATFORM org.
   */
  async assertSuperAdmin(userId: string): Promise<void> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      include: { organisation: true },
    });
    if (!user || user.role !== 'SUPER_ADMIN' || user.organisation.type !== 'PLATFORM') {
      throw new ForbiddenException('Super admin access required');
    }
  }

  async platformStats(): Promise<{
    totalOrgs: number; activeOrgs: number; pendingOrgs: number;
    byType: { FACTORY: number; AGENCY: number; CA_FIRM: number };
    totalUsers: number;
    totalOrders: number;
    totalGMV: number; // paise
    relationships: number;
  }> {
    const [orgs, users, orders, gmv, rels] = await Promise.all([
      this.prisma.client.organisation.findMany({ where: { type: { not: 'PLATFORM' } } }),
      this.prisma.client.user.count(),
      this.prisma.client.order.count(),
      this.prisma.client.order.aggregate({
        _sum: { totalValue: true },
        where: { status: { in: ['DISPATCHED', 'DELIVERED'] } },
      }),
      this.prisma.client.orgRelationship.count({ where: { status: 'ACTIVE' } }),
    ]);

    return {
      totalOrgs: orgs.length,
      activeOrgs: orgs.filter((o) => o.isActive).length,
      pendingOrgs: orgs.filter((o) => !o.isActive).length,
      byType: {
        FACTORY: orgs.filter((o) => o.type === 'FACTORY').length,
        AGENCY: orgs.filter((o) => o.type === 'AGENCY').length,
        CA_FIRM: orgs.filter((o) => o.type === 'CA_FIRM').length,
      },
      totalUsers: users,
      totalOrders: orders,
      totalGMV: Number(gmv._sum.totalValue ?? 0n),
      relationships: rels,
    };
  }

  async listAllOrganisations(): Promise<Array<{
    id: string; name: string; type: string; plan: string;
    isActive: boolean; gstin: string | null;
    userCount: number; createdAt: Date;
  }>> {
    const orgs = await this.prisma.client.organisation.findMany({
      where: { type: { not: 'PLATFORM' } },
      include: { _count: { select: { users: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return orgs.map((o) => ({
      id: o.id, name: o.name, type: o.type, plan: o.plan,
      isActive: o.isActive, gstin: o.gstin,
      userCount: o._count.users, createdAt: o.createdAt,
    }));
  }

  async toggleOrgActive(orgId: string): Promise<{ id: string; isActive: boolean }> {
    const org = await this.prisma.client.organisation.findUnique({ where: { id: orgId } });
    if (!org) throw new ForbiddenException('Organisation not found');
    const updated = await this.prisma.client.organisation.update({
      where: { id: orgId }, data: { isActive: !org.isActive },
    });
    return { id: updated.id, isActive: updated.isActive };
  }

  async setPlan(orgId: string, plan: string): Promise<{ id: string; plan: string }> {
    const updated = await this.prisma.client.organisation.update({
      where: { id: orgId }, data: { plan: plan as never },
    });
    return { id: updated.id, plan: updated.plan };
  }
}
