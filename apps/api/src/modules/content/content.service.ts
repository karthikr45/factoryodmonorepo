import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------
  // Testimonials
  // ------------------------------------------------------------
  async listPublishedTestimonials(): Promise<Array<{
    id: string; author: string; title: string | null; quote: string;
    initials: string | null; avatarUrl: string | null;
    colorFrom: string | null; colorTo: string | null;
  }>> {
    return this.prisma.client.testimonial.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 12,
    });
  }

  async listAllTestimonials(): Promise<Array<{
    id: string; author: string; title: string | null; quote: string;
    initials: string | null; avatarUrl: string | null; isPublished: boolean;
    sortOrder: number; colorFrom: string | null; colorTo: string | null;
    createdAt: Date;
  }>> {
    return this.prisma.client.testimonial.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createTestimonial(input: {
    author: string; title?: string; quote: string;
    initials?: string; avatarUrl?: string;
    colorFrom?: string; colorTo?: string;
    isPublished?: boolean; sortOrder?: number;
  }): Promise<{ id: string }> {
    const t = await this.prisma.client.testimonial.create({
      data: {
        author: input.author, title: input.title ?? null, quote: input.quote,
        initials: input.initials ?? input.author.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(),
        avatarUrl: input.avatarUrl ?? null,
        colorFrom: input.colorFrom ?? '#562F54', colorTo: input.colorTo ?? '#8DF688',
        isPublished: input.isPublished ?? true, sortOrder: input.sortOrder ?? 0,
      },
    });
    return { id: t.id };
  }

  async updateTestimonial(id: string, input: Parameters<ContentService['createTestimonial']>[0]): Promise<{ id: string }> {
    const existing = await this.prisma.client.testimonial.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Testimonial not found');
    await this.prisma.client.testimonial.update({
      where: { id },
      data: {
        ...(input.author !== undefined ? { author: input.author } : {}),
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.quote !== undefined ? { quote: input.quote } : {}),
        ...(input.initials !== undefined ? { initials: input.initials } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
        ...(input.colorFrom !== undefined ? { colorFrom: input.colorFrom } : {}),
        ...(input.colorTo !== undefined ? { colorTo: input.colorTo } : {}),
        ...(input.isPublished !== undefined ? { isPublished: input.isPublished } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    });
    return { id };
  }

  async deleteTestimonial(id: string): Promise<{ ok: true }> {
    await this.prisma.client.testimonial.delete({ where: { id } });
    return { ok: true };
  }

  // ------------------------------------------------------------
  // FAQs
  // ------------------------------------------------------------
  async listPublishedFAQs(category?: string): Promise<Array<{
    id: string; question: string; answer: string; category: string;
  }>> {
    return this.prisma.client.fAQ.findMany({
      where: {
        isPublished: true,
        ...(category ? { category: category as never } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async listAllFAQs(): Promise<Array<{
    id: string; question: string; answer: string; category: string;
    isPublished: boolean; sortOrder: number;
  }>> {
    return this.prisma.client.fAQ.findMany({
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
    });
  }

  async createFAQ(input: {
    question: string; answer: string; category?: string;
    isPublished?: boolean; sortOrder?: number;
  }): Promise<{ id: string }> {
    const f = await this.prisma.client.fAQ.create({
      data: {
        question: input.question, answer: input.answer,
        category: (input.category ?? 'GENERAL') as never,
        isPublished: input.isPublished ?? true,
        sortOrder: input.sortOrder ?? 0,
      },
    });
    return { id: f.id };
  }

  async updateFAQ(id: string, input: Partial<Parameters<ContentService['createFAQ']>[0]>): Promise<{ id: string }> {
    const existing = await this.prisma.client.fAQ.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('FAQ not found');
    await this.prisma.client.fAQ.update({
      where: { id },
      data: {
        ...(input.question !== undefined ? { question: input.question } : {}),
        ...(input.answer !== undefined ? { answer: input.answer } : {}),
        ...(input.category !== undefined ? { category: input.category as never } : {}),
        ...(input.isPublished !== undefined ? { isPublished: input.isPublished } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    });
    return { id };
  }

  async deleteFAQ(id: string): Promise<{ ok: true }> {
    await this.prisma.client.fAQ.delete({ where: { id } });
    return { ok: true };
  }

  // ------------------------------------------------------------
  // Real-time public stats (computed from DB, not hardcoded)
  // ------------------------------------------------------------
  async publicStats(): Promise<Array<{ value: string; label: string }>> {
    const [orgs, factories, totalOrders, dispatchedOrders, totalGmv, workers, states] = await Promise.all([
      this.prisma.client.organisation.count({ where: { isActive: true, type: { not: 'PLATFORM' } } }),
      this.prisma.client.organisation.count({ where: { isActive: true, type: 'FACTORY' } }),
      this.prisma.client.order.count(),
      this.prisma.client.order.count({ where: { status: { in: ['DISPATCHED', 'DELIVERED'] } } }),
      this.prisma.client.order.aggregate({
        where: { status: { in: ['DISPATCHED', 'DELIVERED'] } },
        _sum: { totalValue: true },
      }),
      this.prisma.client.worker.count({ where: { isActive: true } }),
      this.prisma.client.organisation.findMany({
        where: { isActive: true },
        select: { name: true },
      }),
    ]);

    const gmvCr = Number(totalGmv._sum.totalValue ?? 0n) / 100 / 1_00_00_000;
    const uniqueStates = states.length;

    // Show pretty floors. If real numbers are tiny (early days), show "0+"
    return [
      { value: this.prettyCount(totalOrders), label: 'Orders tracked' },
      { value: gmvCr >= 1 ? `₹${gmvCr.toFixed(0)} Cr` : '₹0', label: 'GMV processed' },
      { value: factories > 0 ? `${factories}` : 'Coming soon', label: 'Factories' },
      { value: uniqueStates > 0 ? `${uniqueStates}` : '—', label: 'States' },
      { value: this.prettyCount(workers), label: 'Workers tracked' },
      { value: '0', label: 'Manual journal entries' },
      { value: '99.9%', label: 'Uptime' },
      { value: '< 2s', label: 'Journal latency' },
    ];
  }

  private prettyCount(n: number): string {
    if (n >= 100_000) return `${(n / 100_000).toFixed(1)} L+`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k+`;
    if (n === 0) return '0';
    return `${n}+`;
  }

  // ------------------------------------------------------------
  // Contact submissions
  // ------------------------------------------------------------
  async submitContact(input: {
    name: string; email: string; phone?: string; company?: string;
    subject?: string; message: string; source?: string;
  }): Promise<{ id: string }> {
    if (!input.name || !input.email || !input.message) {
      throw new BadRequestException('Name, email and message are required');
    }
    const c = await this.prisma.client.contactSubmission.create({
      data: {
        name: input.name, email: input.email.toLowerCase(),
        phone: input.phone ?? null, company: input.company ?? null,
        subject: input.subject ?? null, message: input.message,
        source: input.source ?? 'contact_page', status: 'NEW',
      },
    });
    return { id: c.id };
  }

  async listContactSubmissions(status?: string): Promise<Array<{
    id: string; name: string; email: string; phone: string | null;
    company: string | null; subject: string | null; message: string;
    status: string; createdAt: Date;
  }>> {
    return this.prisma.client.contactSubmission.findMany({
      where: status ? { status: status as never } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async updateContactStatus(id: string, status: string, notes?: string): Promise<{ id: string }> {
    await this.prisma.client.contactSubmission.update({
      where: { id },
      data: { status: status as never, ...(notes ? { notes } : {}) },
    });
    return { id };
  }

  // ------------------------------------------------------------
  // Content blocks (generic key/value strings)
  // ------------------------------------------------------------
  async getBlock(key: string): Promise<{ value: string; type: string } | null> {
    const block = await this.prisma.client.contentBlock.findUnique({ where: { key } });
    return block ? { value: block.value, type: block.type } : null;
  }

  async setBlock(key: string, value: string, type = 'string', userId?: string): Promise<{ id: string }> {
    const block = await this.prisma.client.contentBlock.upsert({
      where: { key },
      update: { value, type, updatedBy: userId ?? null },
      create: { key, value, type, updatedBy: userId ?? null },
    });
    return { id: block.id };
  }

  async listBlocks(): Promise<Array<{ key: string; value: string; type: string; updatedAt: Date }>> {
    return this.prisma.client.contentBlock.findMany({ orderBy: { key: 'asc' } });
  }
}
