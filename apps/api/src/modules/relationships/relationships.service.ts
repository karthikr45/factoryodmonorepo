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
