import { BadRequestException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';

import { OrderStatus } from '@repo/types';

import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { OrdersService } from '../orders/orders.service';

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

export interface FireEventInput {
  /** Enum value from ApprovalTriggerType, e.g. 'PURCHASE_ORDER', 'PAYMENT_OUT'. */
  triggerType: string;
  /** The kind of record the approval is attached to, e.g. 'ORDER', 'PO', 'PAYROLL'. */
  subjectType: string;
  /** The id of that record. */
  subjectId: string;
  /** The user whose action triggered the check. */
  requestedBy: string;
  /** The numeric value the rule is evaluated against (e.g. PO total in paise, overtime hours). */
  fieldValue: number;
  /** Anything the approver UI should show — description, amount, party name, etc. */
  metadata?: Record<string, unknown>;
}

export interface FireEventResult {
  /** True if at least one active rule matched. Caller should pause the operation. */
  requiresApproval: boolean;
  /** IDs of pending approval requests created. Empty when requiresApproval=false. */
  requestIds: string[];
}

@Injectable()
export class ApprovalsService {
  private readonly logger = new Logger(ApprovalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    @Inject(forwardRef(() => OrdersService))
    private readonly orders: OrdersService,
  ) {}

  /**
   * Evaluate all active rules for an orgId+triggerType and, if any match the
   * supplied fieldValue, create ApprovalRequest row(s) and notify approvers.
   *
   * Callers should NOT complete the downstream action (dispatching the order,
   * paying the PO, etc.) when requiresApproval is true. They should instead
   * mark the record PENDING_APPROVAL and unlock it once act() is called.
   */
  async fireEvent(orgId: string, input: FireEventInput): Promise<FireEventResult> {
    const rules = await this.prisma.client.approvalRule.findMany({
      where: { orgId, triggerType: input.triggerType as never, isActive: true },
      orderBy: { priority: 'asc' },
    });
    const matched = rules.filter((r) => this.matches(r.conditionOp, r.conditionValue, input.fieldValue));
    if (matched.length === 0) return { requiresApproval: false, requestIds: [] };

    const requestIds: string[] = [];
    for (const rule of matched) {
      const expiresAt = rule.slaHours ? new Date(Date.now() + rule.slaHours * 3_600_000) : null;
      const req = await this.prisma.client.approvalRequest.create({
        data: {
          orgId,
          ruleId: rule.id,
          triggerType: input.triggerType as never,
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          requestedBy: input.requestedBy,
          status: 'PENDING',
          currentLevel: 0,
          expiresAt,
          metadata: (input.metadata ?? {}) as never,
        },
      });
      requestIds.push(req.id);

      // Notify approvers. approverRoleIds holds CustomRole ids — find users
      // assigned to those roles (or fall back to OWNER users).
      const approverRoleIds = (rule.approverRoleIds as string[]) ?? [];
      const approvers = approverRoleIds.length
        ? await this.prisma.client.user.findMany({
            where: { orgId, customRoleId: { in: approverRoleIds }, isActive: true },
            select: { id: true },
          })
        : await this.prisma.client.user.findMany({
            where: { orgId, role: 'OWNER', isActive: true },
            select: { id: true },
          });

      for (const a of approvers) {
        await this.notifications.notifyUser({
          userId: a.id,
          orgId,
          type: 'GENERIC',
          title: `Approval needed: ${rule.name}`,
          body: `${input.subjectType} ${input.subjectId} is pending your approval.`,
          metadata: { approvalRequestId: req.id, subjectType: input.subjectType, subjectId: input.subjectId },
        }).catch((e: unknown) => this.logger.warn(`notifyUser failed: ${String(e)}`));
      }
    }

    return { requiresApproval: true, requestIds };
  }

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

  async act(orgId: string, id: string, userId: string, action: 'APPROVE' | 'REJECT', notes?: string): Promise<{ status: string; resumed?: boolean; resumeError?: string }> {
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

    // Notify the original requester that their request was resolved.
    await this.notifications.notifyUser({
      userId: req.requestedBy,
      orgId,
      type: 'GENERIC',
      title: action === 'APPROVE' ? 'Your request was approved' : 'Your request was rejected',
      body: `${req.subjectType} ${req.subjectId}: ${action.toLowerCase()}${notes ? ` — ${notes}` : ''}`,
      metadata: { approvalRequestId: req.id, subjectType: req.subjectType, subjectId: req.subjectId },
    }).catch((e: unknown) => this.logger.warn(`notifyUser (requester) failed: ${String(e)}`));

    if (action !== 'APPROVE') {
      return { status: 'REJECTED' };
    }

    // Auto-resume the original action so the requester doesn't have to re-click.
    // We invoke the same service method the original blocked call would have hit.
    let resumed = false;
    let resumeError: string | undefined;
    try {
      if (req.subjectType === 'ORDER' && req.triggerType === 'ORDER_DISPATCH') {
        await this.orders.changeStatus(orgId, req.requestedBy, req.subjectId, {
          status: OrderStatus.DISPATCHED,
          note: `Auto-dispatched after approval ${id}`,
        });
        resumed = true;
      }
      // Other trigger types (PURCHASE_ORDER, PAYMENT_OUT, etc.) currently allow
      // the action to complete on first attempt — only an audit trail is added.
      // Wire additional resume handlers here as those flows start blocking too.
    } catch (e) {
      resumeError = e instanceof Error ? e.message : String(e);
      this.logger.warn(`Auto-resume failed for ${req.subjectType}/${req.subjectId}: ${resumeError}`);
    }

    return { status: 'APPROVED', resumed, ...(resumeError ? { resumeError } : {}) };
  }
}
