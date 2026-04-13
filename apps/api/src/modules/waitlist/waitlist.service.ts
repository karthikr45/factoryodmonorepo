import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class WaitlistService {
  constructor(private readonly prisma: PrismaService) {}

  async join(input: {
    email: string; phone?: string; businessName?: string;
    vertical?: string; workerCount?: string; state?: string; source?: string;
  }): Promise<{ id: string; position: number }> {
    const existing = await this.prisma.client.waitlistEntry.findUnique({
      where: { email: input.email.toLowerCase() },
    });
    if (existing) {
      throw new BadRequestException('This email is already on the waitlist');
    }
    const entry = await this.prisma.client.waitlistEntry.create({
      data: {
        email: input.email.toLowerCase(),
        phone: input.phone ?? null,
        businessName: input.businessName ?? null,
        vertical: input.vertical ?? null,
        workerCount: input.workerCount ?? null,
        state: input.state ?? null,
        source: input.source ?? 'landing',
      },
    });
    const position = await this.prisma.client.waitlistEntry.count({
      where: { createdAt: { lte: entry.createdAt } },
    });
    return { id: entry.id, position };
  }

  async list(): Promise<{
    total: number;
    byVertical: Record<string, number>;
    byWorkerCount: Record<string, number>;
    recent: Array<{ id: string; email: string; businessName: string | null; vertical: string | null; createdAt: Date }>;
  }> {
    const [total, entries] = await Promise.all([
      this.prisma.client.waitlistEntry.count(),
      this.prisma.client.waitlistEntry.findMany({
        orderBy: { createdAt: 'desc' }, take: 50,
      }),
    ]);
    const byVertical: Record<string, number> = {};
    const byWorkerCount: Record<string, number> = {};
    for (const e of entries) {
      const v = e.vertical ?? 'unknown';
      byVertical[v] = (byVertical[v] ?? 0) + 1;
      const w = e.workerCount ?? 'unknown';
      byWorkerCount[w] = (byWorkerCount[w] ?? 0) + 1;
    }
    return {
      total, byVertical, byWorkerCount,
      recent: entries.slice(0, 20).map((e) => ({
        id: e.id, email: e.email, businessName: e.businessName,
        vertical: e.vertical, createdAt: e.createdAt,
      })),
    };
  }
}
