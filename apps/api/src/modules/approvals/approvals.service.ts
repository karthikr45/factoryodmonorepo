import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

interface CreateRuleInput {
  name: string;
  triggerType: string;
  conditionField?: string;
  conditionOp?: string;
  conditionValue?: number;
  approverRoleIds: string[];
  approvalType?: string;
  slaHours?: number;
  priority?: number;
}

@Injectable()
export class ApprovalsService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Rules ----
  async listRules(orgId: string): Promise<Array<{
    id: string; name: string; triggerType: string;
    conditionField: string | null; conditionOp: string; conditionValue: number | null;
    approverRoleIds: string[]; approvalType: string;
    slaHours: number | null; isActive: boolean; priority: number;
  }>> {
    const rows = await this.prisma.client.approvalRule.findMany({
      where: { orgId },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map((r) => ({
      id: r.id, name: r.name, triggerType: r.triggerType,
      conditionField: r.conditionField, conditionOp: r.conditionOp,
      conditionValue: r.conditionValue,
      approverRoleIds: (r.approverRoleIds as string[]) ?? [],
      approvalType: r.approvalType,
      slaHours: r.slaHours, isActive: r.isActive, priority: r.priority,
    }));
  }

  async createRule(orgId: string, input: CreateRuleInput): Promise<{ id: string }> {
    const r = await this.prisma.client.approvalRule.create({
      data: {
        orgId, name: input.name,
        triggerType: input.triggerType as never,
        conditionField: input.conditionField ?? null,
        conditionOp: (input.conditionOp ?? 'ANY') as never,
        conditionValue: input.conditionValue ?? null,
        approverRoleIds: input.approverRoleIds as never,
        approvalType: (input.approvalType ?? 'SEQUENTIAL') as never,
        slaHours: input.slaHours ?? null,
        priority: input.priority ?? 100,
        isActive: true,
      },
    });
    return { id: r.id };
  }

  async updateRule(orgId: string, id: string, input: Partial<CreateRuleInput> & { isActive?: boolean }): Promise<{ id: string }> {
    const existing = await this.prisma.client.approvalRule.findFirst({ where: { id, orgId } });
    if (!existing) throw new NotFoundException('Rule not found');
    await this.prisma.client.approvalRule.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.triggerType !== undefined ? { triggerType: input.triggerType as never } : {}),
        ...(input.conditionField !== undefined ? { conditionField: input.conditionField } : {}),
        ...(input.conditionOp !== undefined ? { conditionOp: input.conditionOp as never } : {}),
        ...(input.conditionValue !== undefined ? { conditionValue: input.conditionValue } : {}),
        ...(input.approverRoleIds !== undefined ? { approverRoleIds: input.approverRoleIds as never } : {}),
        ...(input.approvalType !== undefined ? { approvalType: input.approvalType as never } : {}),
        ...(input.slaHours !== undefined ? { slaHours: input.slaHours } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
    return { id };
  }

  async deleteRule(orgId: string, id: string): Promise<{ ok: true }> {
    const r = await this.prisma.client.approvalRule.findFirst({ where: { id, orgId } });
    if (!r) throw new NotFoundException('Rule not found');
    await this.prisma.client.approvalRule.delete({ where: { id } });
    return { ok: true };
  }

  /**
   * Test a rule: "what happens if someone raises a 3-hour overtime?"
   * Returns the matching rule(s) that would fire.
   */
  async simulate(orgId: string, triggerType: string, fieldValue: number): Promise<Array<{
    id: string; name: string; approverRoleIds: string[]; approvalType: string;
  }>> {
    const all = await this.prisma.client.approvalRule.findMany({
      where: { orgId, triggerType: triggerType as never, isActive: true },
      orderBy: { priority: 'asc' },
    });
    const matches = all.filter((r) => this.matches(r.conditionOp, r.conditionValue, fieldValue));
    return matches.map((r) => ({
      id: r.id, name: r.name,
      approverRoleIds: (r.approverRoleIds as string[]) ?? [],
      approvalType: r.approvalType,
    }));
  }

  private matches(op: string, threshold: number | null, value: number): boolean {
    if (op === 'ANY' || threshold === null) return true;
    switch (op) {
      case 'GT': return value > threshold;
      case 'GTE': return value >= threshold;
      case 'LT': return value < threshold;
      case 'LTE': return value <= threshold;
      case 'EQ': return value === threshold;
      case 'NEQ': return value !== threshold;
      default: return false;
    }
  }

  // ---- Requests (actual pending approvals) ----
  async listPending(orgId: string): Promise<Array<{
    id: string; triggerType: string; subjectType: string; subjectId: string;
    status: string; currentLevel: number; createdAt: Date; metadata: unknown;
    requesterName: string | null;
  }>> {
    const rows = await this.prisma.client.approvalRequest.findMany({
      where: { orgId, status: 'PENDING' },
      include: { requester: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id, triggerType: r.triggerType, subjectType: r.subjectType,
      subjectId: r.subjectId, status: r.status, currentLevel: r.currentLevel,
      createdAt: r.createdAt, metadata: r.metadata,
      requesterName: r.requester?.name ?? null,
    }));
  }

  async act(orgId: string, id: string, userId: string, action: 'APPROVE' | 'REJECT', notes?: string): Promise<{ status: string }> {
    const req = await this.prisma.client.approvalRequest.findFirst({ where: { id, orgId } });
    if (!req) throw new NotFoundException('Approval request not found');
    if (req.status !== 'PENDING') throw new BadRequestException('Already resolved');

    const history = (req.approvals as Array<Record<string, unknown>>) ?? [];
    history.push({ approverId: userId, level: req.currentLevel, action, at: new Date(), notes });

    await this.prisma.client.approvalRequest.update({
      where: { id },
      data: {
        status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        resolvedAt: new Date(),
        approvals: history as never,
      },
    });

    return { status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' };
  }
}
