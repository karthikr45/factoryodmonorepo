import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { JobCardStatus, OrderStatus } from '@repo/types';
import type {
  AssignJobCardInput,
  CreateDepartmentInput,
  CreateJobCardsInput,
  UpdateJobCardStatusInput,
} from '@repo/validators';

import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProductionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly gateway: NotificationsGateway,
  ) {}

  // ---- Departments ----

  async listDepartments(orgId: string): Promise<
    Array<{
      id: string;
      name: string;
      sequence: number;
      managerId: string | null;
      isActive: boolean;
    }>
  > {
    return this.prisma.client.department.findMany({
      where: { orgId, isActive: true },
      orderBy: { sequence: 'asc' },
    });
  }

  async createDepartment(
    orgId: string,
    input: CreateDepartmentInput,
  ): Promise<{ id: string }> {
    const dept = await this.prisma.client.department.create({
      data: {
        orgId,
        name: input.name,
        sequence: input.sequence,
        managerId: input.managerId ?? null,
        isActive: true,
      },
    });
    return { id: dept.id };
  }

  // ---- Job cards ----

  /**
   * Generate job cards for an order. One card per department in the pipeline
   * (unless specific department IDs are provided). Transitions order to IN_PRODUCTION.
   */
  async createJobCards(
    orgId: string,
    input: CreateJobCardsInput,
  ): Promise<{ created: number }> {
    const order = await this.prisma.client.order.findFirst({
      where: { id: input.orderId, orgId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'CONFIRMED' && order.status !== 'IN_PRODUCTION') {
      throw new BadRequestException(
        'Order must be in CONFIRMED or IN_PRODUCTION state to create job cards',
      );
    }

    const departments = await this.prisma.client.department.findMany({
      where: {
        orgId,
        isActive: true,
        ...(input.departmentIds ? { id: { in: input.departmentIds } } : {}),
      },
      orderBy: { sequence: 'asc' },
    });
    if (departments.length === 0) {
      throw new BadRequestException('No departments configured');
    }

    await this.prisma.client.jobCard.createMany({
      data: departments.map((d) => ({
        orderId: input.orderId,
        departmentId: d.id,
        orgId,
        status: 'PENDING' as const,
      })),
    });

    if (order.status === 'CONFIRMED') {
      await this.prisma.client.order.update({
        where: { id: order.id },
        data: { status: 'IN_PRODUCTION' },
      });
      this.gateway.emitToOrg(orgId, 'order:status_changed', {
        id: order.id,
        status: OrderStatus.IN_PRODUCTION,
      });
    }

    return { created: departments.length };
  }

  async listJobCards(
    orgId: string,
    filters: { status?: JobCardStatus; departmentId?: string; orderId?: string },
  ): Promise<
    Array<{
      id: string;
      status: JobCardStatus;
      startedAt: Date | null;
      completedAt: Date | null;
      department: { id: string; name: string; sequence: number };
      order: { id: string; orderNumber: string; productName: string };
      assignedTo: string | null;
    }>
  > {
    const rows = await this.prisma.client.jobCard.findMany({
      where: {
        orgId,
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
        ...(filters.orderId ? { orderId: filters.orderId } : {}),
      },
      include: {
        department: { select: { id: true, name: true, sequence: true } },
        order: { select: { id: true, orderNumber: true, productName: true } },
      },
      orderBy: [{ department: { sequence: 'asc' } }, { order: { deliveryDate: 'asc' } }],
      take: 500,
    });
    return rows.map((jc) => ({
      id: jc.id,
      status: jc.status as JobCardStatus,
      startedAt: jc.startedAt,
      completedAt: jc.completedAt,
      department: jc.department,
      order: jc.order,
      assignedTo: jc.assignedTo,
    }));
  }

  /**
   * Job cards assigned to the current user — for worker self-service.
   * Also returns PENDING cards in their department if they're in one.
   */
  async listMine(orgId: string, userId: string): Promise<Array<{
    id: string; status: JobCardStatus;
    department: { id: string; name: string; sequence: number };
    order: { id: string; orderNumber: string; productName: string; quantity: number; unit: string };
    startedAt: Date | null; completedAt: Date | null;
    assignedTo: string | null;
  }>> {
    const profile = await this.prisma.client.employeeProfile.findUnique({ where: { userId } });
    const deptId = profile?.departmentId;

    const rows = await this.prisma.client.jobCard.findMany({
      where: {
        orgId,
        OR: [
          { assignedTo: userId },
          ...(deptId ? [{ departmentId: deptId, assignedTo: null, status: 'PENDING' as const }] : []),
          ...(deptId ? [{ departmentId: deptId, status: 'IN_PROGRESS' as const }] : []),
        ],
      },
      include: {
        department: { select: { id: true, name: true, sequence: true } },
        order: { select: { id: true, orderNumber: true, productName: true, quantity: true, unit: true } },
      },
      orderBy: [{ status: 'asc' }, { order: { deliveryDate: 'asc' } }],
      take: 50,
    });
    return rows.map((jc) => ({
      id: jc.id, status: jc.status as JobCardStatus,
      department: jc.department, order: jc.order,
      startedAt: jc.startedAt, completedAt: jc.completedAt,
      assignedTo: jc.assignedTo,
    }));
  }

  async assign(
    orgId: string,
    id: string,
    input: AssignJobCardInput,
  ): Promise<{ id: string }> {
    const jc = await this.prisma.client.jobCard.findFirst({ where: { id, orgId } });
    if (!jc) throw new NotFoundException('Job card not found');

    const user = await this.prisma.client.user.findFirst({
      where: { id: input.assignedTo, orgId },
    });
    if (!user) throw new BadRequestException('Assignee must belong to the organisation');

    await this.prisma.client.jobCard.update({
      where: { id },
      data: { assignedTo: input.assignedTo },
    });
    this.gateway.emitToUser(input.assignedTo, 'jobcard:assigned', { id });
    await this.notifications.notifyUser({
      userId: input.assignedTo,
      orgId,
      type: 'JOBCARD_ASSIGNED',
      title: 'New job card assigned',
      body: 'You have a new job card to work on',
      metadata: { jobCardId: id },
    });
    return { id };
  }

  async updateStatus(
    orgId: string,
    id: string,
    input: UpdateJobCardStatusInput,
  ): Promise<{ id: string; status: JobCardStatus }> {
    const jc = await this.prisma.client.jobCard.findFirst({
      where: { id, orgId },
      include: { department: true, order: true },
    });
    if (!jc) throw new NotFoundException('Job card not found');

    const now = new Date();
    const updated = await this.prisma.client.jobCard.update({
      where: { id },
      data: {
        status: input.status,
        notes: input.notes ?? jc.notes,
        ...(input.status === 'IN_PROGRESS' && !jc.startedAt ? { startedAt: now } : {}),
        ...(input.status === 'COMPLETED' ? { completedAt: now } : {}),
      },
    });

    // Block COMPLETED if a QC stage hasn't been performed yet.
    if (input.status === 'COMPLETED' && jc.qcRequired) {
      const passed = await this.prisma.client.qualityCheck.count({
        where: { jobCardId: id, status: 'PASSED' as never },
      });
      if (passed === 0) {
        // Roll back the optimistic update.
        await this.prisma.client.jobCard.update({
          where: { id },
          data: { status: jc.status, completedAt: jc.completedAt },
        });
        throw new BadRequestException('This stage requires a passed QC before it can be completed');
      }
    }

    // When a job card completes, advance the workflow.
    if (input.status === 'COMPLETED') {
      await this.advanceWorkflow(orgId, jc, updated);
    }

    return { id: updated.id, status: updated.status as JobCardStatus };
  }

  /**
   * Decide what to do after a job card completes:
   *  - If parallelGroupId is set and siblings still pending, do nothing yet.
   *  - Otherwise notify the next sequential stage's manager.
   *  - When all stages on the order are done, transition order to QUALITY_CHECK.
   */
  private async advanceWorkflow(
    orgId: string,
    completed: { id: string; orderId: string; departmentId: string; parallelGroupId: string | null; stageSequence: number | null },
    completedRow: { status: string },
  ): Promise<void> {
    void completedRow;
    // 1) Are there still parallel siblings in flight? If so, stop here.
    if (completed.parallelGroupId) {
      const siblingsPending = await this.prisma.client.jobCard.count({
        where: {
          orderId: completed.orderId,
          parallelGroupId: completed.parallelGroupId,
          id: { not: completed.id },
          status: { not: 'COMPLETED' },
        },
      });
      if (siblingsPending > 0) {
        this.gateway.emitToOrg(orgId, 'jobcard:completed', {
          id: completed.id,
          orderId: completed.orderId,
          departmentId: completed.departmentId,
          waitingFor: siblingsPending,
        });
        return;
      }
    }

    // 2) Any remaining open job cards on the order at all?
    const remaining = await this.prisma.client.jobCard.count({
      where: { orderId: completed.orderId, status: { not: 'COMPLETED' } },
    });
    if (remaining === 0) {
      await this.prisma.client.order.update({
        where: { id: completed.orderId },
        data: { status: 'QUALITY_CHECK' },
      });
      this.gateway.emitToOrg(orgId, 'order:status_changed', {
        id: completed.orderId,
        status: OrderStatus.QUALITY_CHECK,
      });
    } else {
      // 3) Find the NEXT stage (by sequence, falling back to department.sequence
      //    for legacy orders that didn't come from a workflow).
      const orderBySequence = completed.stageSequence !== null
        ? { stageSequence: 'asc' as const }
        : { department: { sequence: 'asc' as const } };
      const next = await this.prisma.client.jobCard.findFirst({
        where: {
          orderId: completed.orderId,
          status: 'PENDING',
          ...(completed.stageSequence !== null
            ? { stageSequence: { gt: completed.stageSequence } }
            : {}),
        },
        orderBy: orderBySequence,
        include: { department: true },
      });
      if (next?.department.managerId) {
        await this.notifications.notifyUser({
          userId: next.department.managerId,
          orgId,
          type: 'JOBCARD_COMPLETED',
          title: `Stage complete on order — next: ${next.department.name}`,
          body: `Ready to start ${next.department.name}`,
          metadata: { orderId: completed.orderId, nextJobCardId: next.id },
        });
      }
    }

    this.gateway.emitToOrg(orgId, 'jobcard:completed', {
      id: completed.id,
      orderId: completed.orderId,
      departmentId: completed.departmentId,
    });
  }
}
