import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class RelationshipsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List active partners for an organisation.
   * For a factory: returns their CAs and staffing agencies.
   * For an agency: returns the factories they supply to.
   * For a CA firm: returns the factory clients.
   */
  async listPartners(orgId: string): Promise<{
    incoming: Array<{ id: string; orgName: string; orgType: string; relationshipType: string; status: string; since: Date | null }>;
    outgoing: Array<{ id: string; orgName: string; orgType: string; relationshipType: string; status: string; since: Date | null }>;
  }> {
    const [fromRows, toRows] = await Promise.all([
      this.prisma.client.orgRelationship.findMany({
        where: { fromOrgId: orgId },
        include: { toOrg: { select: { name: true, type: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.orgRelationship.findMany({
        where: { toOrgId: orgId },
        include: { fromOrg: { select: { name: true, type: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      outgoing: fromRows.map((r) => ({
        id: r.id, orgName: r.toOrg.name, orgType: r.toOrg.type,
        relationshipType: r.type, status: r.status, since: r.acceptedAt,
      })),
      incoming: toRows.map((r) => ({
        id: r.id, orgName: r.fromOrg.name, orgType: r.fromOrg.type,
        relationshipType: r.type, status: r.status, since: r.acceptedAt,
      })),
    };
  }

  async acceptRequest(orgId: string, id: string): Promise<{ id: string }> {
    const rel = await this.prisma.client.orgRelationship.findFirst({
      where: { id, toOrgId: orgId, status: 'PENDING' },
    });
    if (!rel) throw new NotFoundException('Request not found');
    await this.prisma.client.orgRelationship.update({
      where: { id }, data: { status: 'ACTIVE', acceptedAt: new Date() },
    });
    return { id };
  }

  async rejectRequest(orgId: string, id: string): Promise<{ id: string }> {
    const rel = await this.prisma.client.orgRelationship.findFirst({
      where: { id, toOrgId: orgId, status: 'PENDING' },
    });
    if (!rel) throw new NotFoundException('Request not found');
    await this.prisma.client.orgRelationship.update({
      where: { id }, data: { status: 'REJECTED' },
    });
    return { id };
  }

  async endRelationship(orgId: string, id: string): Promise<{ id: string }> {
    const rel = await this.prisma.client.orgRelationship.findFirst({
      where: { id, OR: [{ fromOrgId: orgId }, { toOrgId: orgId }] },
    });
    if (!rel) throw new NotFoundException('Relationship not found');
    await this.prisma.client.orgRelationship.update({
      where: { id }, data: { status: 'ENDED', endedAt: new Date() },
    });
    return { id };
  }

  /**
   * For a CA firm: list every factory client with a one-line health snapshot.
   * Cheap aggregation — counts only, no balance-sheet maths — so this scales
   * to a CA with 50+ small-business clients.
   */
  async caClients(caOrgId: string): Promise<Array<{
    orgId: string;
    orgName: string;
    gstin: string | null;
    sinceDate: Date | null;
    openInvoices: number;
    overdueInvoices: number;
    pendingGstReturns: number;
    last30dRevenue: number; // rupees
  }>> {
    // Two relationship directions to consider: CA invited the factory (from=CA)
    // OR factory invited the CA (from=Factory). Either way the CA reads the
    // factory's books.
    const [fromCa, toCa] = await Promise.all([
      this.prisma.client.orgRelationship.findMany({
        where: { fromOrgId: caOrgId, type: 'FACTORY_CA', status: 'ACTIVE' },
        include: { toOrg: { select: { id: true, name: true, gstin: true } } },
      }),
      this.prisma.client.orgRelationship.findMany({
        where: { toOrgId: caOrgId, type: 'FACTORY_CA', status: 'ACTIVE' },
        include: { fromOrg: { select: { id: true, name: true, gstin: true } } },
      }),
    ]);

    const clients = [
      ...fromCa.map((r) => ({ orgId: r.toOrg.id, orgName: r.toOrg.name, gstin: r.toOrg.gstin, sinceDate: r.acceptedAt })),
      ...toCa.map((r) => ({ orgId: r.fromOrg.id, orgName: r.fromOrg.name, gstin: r.fromOrg.gstin, sinceDate: r.acceptedAt })),
    ];
    // Dedup if both directions exist for the same pair.
    const dedup = new Map<string, typeof clients[number]>();
    for (const c of clients) dedup.set(c.orgId, c);

    const since30d = new Date(Date.now() - 30 * 86_400_000);
    const out: Array<{
      orgId: string; orgName: string; gstin: string | null; sinceDate: Date | null;
      openInvoices: number; overdueInvoices: number; pendingGstReturns: number; last30dRevenue: number;
    }> = [];
    for (const c of dedup.values()) {
      const [openInvoices, overdueInvoices, pendingGstReturns, revenueAgg] = await Promise.all([
        this.prisma.client.invoice.count({
          where: { orgId: c.orgId, status: { notIn: ['PAID', 'CANCELLED'] } },
        }),
        this.prisma.client.invoice.count({
          where: { orgId: c.orgId, status: { notIn: ['PAID', 'CANCELLED'] }, dueDate: { lt: new Date() } },
        }),
        this.prisma.client.gSTReturn.count({
          where: { orgId: c.orgId, status: 'DRAFT' },
        }),
        this.prisma.client.invoice.aggregate({
          where: { orgId: c.orgId, status: 'PAID', invoiceDate: { gte: since30d } },
          _sum: { totalAmount: true },
        }),
      ]);
      out.push({
        ...c,
        openInvoices,
        overdueInvoices,
        pendingGstReturns,
        last30dRevenue: Number(revenueAgg._sum.totalAmount ?? 0n) / 100,
      });
    }
    return out.sort((a, b) => b.overdueInvoices - a.overdueInvoices || b.openInvoices - a.openInvoices);
  }

  /**
   * Verify the CA org has an active FACTORY_CA relationship with the given
   * factory orgId. Used as an authorization helper before a CA reads a
   * client's data.
   */
  async assertCaCanRead(caOrgId: string, factoryOrgId: string): Promise<void> {
    const link = await this.prisma.client.orgRelationship.findFirst({
      where: {
        type: 'FACTORY_CA',
        status: 'ACTIVE',
        OR: [
          { fromOrgId: caOrgId, toOrgId: factoryOrgId },
          { fromOrgId: factoryOrgId, toOrgId: caOrgId },
        ],
      },
    });
    if (!link) {
      throw new NotFoundException('No active CA relationship with this factory');
    }
  }

  /**
   * Search for organisations to connect with (by GSTIN, phone, or name).
   */
  async searchOrganisations(query: string, excludeOrgId: string): Promise<Array<{
    id: string; name: string; type: string; gstin: string | null;
  }>> {
    if (!query || query.length < 3) return [];
    const rows = await this.prisma.client.organisation.findMany({
      where: {
        id: { not: excludeOrgId },
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { gstin: { contains: query.toUpperCase() } },
        ],
      },
      take: 20,
      select: { id: true, name: true, type: true, gstin: true },
    });
    return rows;
  }
}
