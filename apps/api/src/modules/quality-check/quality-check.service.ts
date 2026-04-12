import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

interface ChecklistItem {
  parameter: string;
  expected: string;
  actual: string;
  passed: boolean;
}

@Injectable()
export class QualityCheckService {
  constructor(private readonly prisma: PrismaService) {}

  async create(orgId: string, userId: string, input: {
    orderId?: string; jobCardId?: string; checklistItems: ChecklistItem[];
  }): Promise<{ id: string }> {
    const qc = await this.prisma.client.qualityCheck.create({
      data: {
        orgId,
        orderId: input.orderId ?? null,
        jobCardId: input.jobCardId ?? null,
        checklistItems: input.checklistItems as never,
        status: 'PENDING',
        inspectedBy: userId,
      },
    });
    return { id: qc.id };
  }

  async updateStatus(orgId: string, id: string, userId: string, input: {
    status: string; defectNotes?: string;
  }): Promise<{ id: string; status: string }> {
    const qc = await this.prisma.client.qualityCheck.findFirst({ where: { id, orgId } });
    if (!qc) throw new NotFoundException('QC record not found');

    const updated = await this.prisma.client.qualityCheck.update({
      where: { id },
      data: {
        status: input.status as never,
        defectNotes: input.defectNotes ?? qc.defectNotes,
        inspectedBy: userId,
        inspectedAt: new Date(),
      },
    });

    // If QC passes and linked to an order, advance order to READY
    if (input.status === 'PASSED' && updated.orderId) {
      await this.prisma.client.order.update({
        where: { id: updated.orderId },
        data: { status: 'READY' },
      });
    }

    // If QC fails → REWORK, send order back to production
    if (input.status === 'REWORK' && updated.orderId) {
      await this.prisma.client.order.update({
        where: { id: updated.orderId },
        data: { status: 'IN_PRODUCTION' },
      });
    }

    return { id: updated.id, status: updated.status };
  }

  async listByOrder(orgId: string, orderId: string): Promise<Array<{
    id: string; status: string; checklistItems: ChecklistItem[];
    defectNotes: string | null; inspectedAt: Date | null; createdAt: Date;
  }>> {
    const rows = await this.prisma.client.qualityCheck.findMany({
      where: { orgId, orderId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id, status: r.status,
      checklistItems: r.checklistItems as unknown as ChecklistItem[],
      defectNotes: r.defectNotes, inspectedAt: r.inspectedAt, createdAt: r.createdAt,
    }));
  }

  async list(orgId: string, status?: string): Promise<Array<{
    id: string; status: string; orderId: string | null; jobCardId: string | null;
    defectNotes: string | null; inspectedAt: Date | null; createdAt: Date;
  }>> {
    const rows = await this.prisma.client.qualityCheck.findMany({
      where: { orgId, ...(status ? { status: status as never } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows;
  }
}
