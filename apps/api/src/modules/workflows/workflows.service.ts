import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

import { SYSTEM_TEMPLATES, type SeedStage } from './template-library';

interface UpsertStageInput {
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sequence: number;
  parallelGroupId?: string;
  assignedRoleId?: string;
  slaHours?: number;
  qcRequired?: boolean;
  qcChecklist?: Array<{ parameter: string; expected: string }>;
  isOutsourced?: boolean;
  autoAdvance?: 'ALWAYS' | 'ON_QC_PASS' | 'MANUAL';
  notes?: string;
}

interface UpsertTemplateInput {
  id?: string;
  name: string;
  description?: string;
  industry?: string;
  icon?: string;
  isDefault?: boolean;
  stages: UpsertStageInput[];
}

@Injectable()
export class WorkflowsService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------
  // Seed pre-made templates for a new factory (called on onboarding)
  // ------------------------------------------------------------
  async seedSystemTemplates(orgId: string, userId: string): Promise<{ created: number }> {
    let created = 0;
    for (const t of SYSTEM_TEMPLATES) {
      const existing = await this.prisma.client.workflowTemplate.findFirst({
        where: { orgId, name: t.name },
      });
      if (existing) continue;

      await this.prisma.client.workflowTemplate.create({
        data: {
          orgId,
          name: t.name,
          description: t.description,
          industry: t.industry as never,
          icon: t.icon,
          isDefault: t.industry === 'GENERAL',
          isPublished: true,
          createdBy: userId,
          stages: {
            create: t.stages.map((s: SeedStage) => ({
              name: s.name,
              description: s.description ?? null,
              icon: s.icon ?? null,
              color: s.color ?? null,
              sequence: s.sequence,
              slaHours: s.slaHours ?? null,
              qcRequired: s.qcRequired ?? false,
              qcChecklist: (s.qcChecklist ?? null) as never,
              isOutsourced: s.isOutsourced ?? false,
              parallelGroupId: s.parallelGroupId ?? null,
            })),
          },
        },
      });
      created++;
    }
    return { created };
  }

  // ------------------------------------------------------------
  // CRUD
  // ------------------------------------------------------------
  async list(orgId: string): Promise<Array<{
    id: string; name: string; description: string | null; industry: string;
    icon: string | null; isDefault: boolean; stageCount: number; createdAt: Date;
  }>> {
    const rows = await this.prisma.client.workflowTemplate.findMany({
      where: { orgId },
      include: { _count: { select: { stages: true } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return rows.map((r) => ({
      id: r.id, name: r.name, description: r.description,
      industry: r.industry, icon: r.icon, isDefault: r.isDefault,
      stageCount: r._count.stages, createdAt: r.createdAt,
    }));
  }

  async get(orgId: string, id: string): Promise<{
    id: string; name: string; description: string | null; industry: string;
    icon: string | null; isDefault: boolean;
    stages: Array<{
      id: string; name: string; description: string | null; icon: string | null;
      color: string | null; sequence: number; slaHours: number | null;
      qcRequired: boolean; qcChecklist: unknown; isOutsourced: boolean;
      autoAdvance: string; parallelGroupId: string | null;
      assignedRoleId: string | null; notes: string | null;
    }>;
  }> {
    const t = await this.prisma.client.workflowTemplate.findFirst({
      where: { id, orgId },
      include: { stages: { orderBy: { sequence: 'asc' } } },
    });
    if (!t) throw new NotFoundException('Workflow template not found');
    return {
      id: t.id, name: t.name, description: t.description, industry: t.industry,
      icon: t.icon, isDefault: t.isDefault,
      stages: t.stages.map((s) => ({
        id: s.id, name: s.name, description: s.description, icon: s.icon,
        color: s.color, sequence: s.sequence, slaHours: s.slaHours,
        qcRequired: s.qcRequired, qcChecklist: s.qcChecklist,
        isOutsourced: s.isOutsourced, autoAdvance: s.autoAdvance,
        parallelGroupId: s.parallelGroupId, assignedRoleId: s.assignedRoleId,
        notes: s.notes,
      })),
    };
  }

  async create(orgId: string, userId: string, input: UpsertTemplateInput): Promise<{ id: string }> {
    if (!input.stages || input.stages.length === 0) {
      throw new BadRequestException('Workflow must have at least one stage');
    }
    const t = await this.prisma.client.workflowTemplate.create({
      data: {
        orgId, name: input.name, description: input.description ?? null,
        industry: (input.industry ?? 'GENERAL') as never, icon: input.icon ?? null,
        isDefault: input.isDefault ?? false, createdBy: userId,
        stages: {
          create: input.stages.map((s, i) => ({
            name: s.name, description: s.description ?? null, icon: s.icon ?? null,
            color: s.color ?? null, sequence: s.sequence ?? i + 1,
            parallelGroupId: s.parallelGroupId ?? null,
            assignedRoleId: s.assignedRoleId ?? null,
            slaHours: s.slaHours ?? null, qcRequired: s.qcRequired ?? false,
            qcChecklist: (s.qcChecklist ?? null) as never,
            isOutsourced: s.isOutsourced ?? false,
            autoAdvance: (s.autoAdvance ?? 'ALWAYS') as never,
            notes: s.notes ?? null,
          })),
        },
      },
    });

    if (input.isDefault) {
      // Unset isDefault on other templates
      await this.prisma.client.workflowTemplate.updateMany({
        where: { orgId, id: { not: t.id } }, data: { isDefault: false },
      });
    }

    return { id: t.id };
  }

  async update(orgId: string, id: string, input: UpsertTemplateInput): Promise<{ id: string }> {
    const existing = await this.prisma.client.workflowTemplate.findFirst({ where: { id, orgId } });
    if (!existing) throw new NotFoundException('Template not found');

    // Delete and recreate stages to make diff simpler
    await this.prisma.client.workflowStage.deleteMany({ where: { templateId: id } });

    await this.prisma.client.workflowTemplate.update({
      where: { id },
      data: {
        name: input.name, description: input.description ?? null,
        industry: (input.industry ?? existing.industry) as never,
        icon: input.icon ?? null, isDefault: input.isDefault ?? existing.isDefault,
        stages: {
          create: input.stages.map((s, i) => ({
            name: s.name, description: s.description ?? null, icon: s.icon ?? null,
            color: s.color ?? null, sequence: s.sequence ?? i + 1,
            parallelGroupId: s.parallelGroupId ?? null,
            assignedRoleId: s.assignedRoleId ?? null,
            slaHours: s.slaHours ?? null, qcRequired: s.qcRequired ?? false,
            qcChecklist: (s.qcChecklist ?? null) as never,
            isOutsourced: s.isOutsourced ?? false,
            autoAdvance: (s.autoAdvance ?? 'ALWAYS') as never,
            notes: s.notes ?? null,
          })),
        },
      },
    });

    if (input.isDefault) {
      await this.prisma.client.workflowTemplate.updateMany({
        where: { orgId, id: { not: id } }, data: { isDefault: false },
      });
    }
    return { id };
  }

  async delete(orgId: string, id: string): Promise<{ ok: true }> {
    const t = await this.prisma.client.workflowTemplate.findFirst({ where: { id, orgId } });
    if (!t) throw new NotFoundException('Template not found');
    if (t.isDefault) {
      throw new BadRequestException('Cannot delete default workflow. Set another as default first.');
    }
    await this.prisma.client.workflowTemplate.delete({ where: { id } });
    return { ok: true };
  }

  async setDefault(orgId: string, id: string): Promise<{ ok: true }> {
    await this.prisma.client.workflowTemplate.updateMany({
      where: { orgId }, data: { isDefault: false },
    });
    await this.prisma.client.workflowTemplate.update({ where: { id }, data: { isDefault: true } });
    return { ok: true };
  }

  /**
   * Return the default workflow for the org, or null.
   */
  async getDefault(orgId: string): Promise<{ id: string; name: string } | null> {
    const t = await this.prisma.client.workflowTemplate.findFirst({
      where: { orgId, isDefault: true },
    });
    return t ? { id: t.id, name: t.name } : null;
  }
}
