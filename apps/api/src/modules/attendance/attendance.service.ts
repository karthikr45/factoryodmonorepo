import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { AttendanceStatus } from '@repo/types';
import type {
  ApproveAttendanceInput,
  DisputeAttendanceInput,
  MarkAttendanceInput,
} from '@repo/validators';

import { AccountingService } from '../../common/accounting/accounting.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounting: AccountingService,
    private readonly notifications: NotificationsService,
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * Agency admin marks a worker's attendance. Requires an ACTIVE deployment.
   * Upserts by (workerId, date).
   */
  async mark(
    agencyOrgId: string,
    userId: string,
    input: MarkAttendanceInput,
  ): Promise<{ id: string }> {
    const deployment = await this.prisma.client.workerDeployment.findFirst({
      where: {
        workerId: input.workerId,
        agencyOrgId,
        status: 'ACTIVE',
      },
    });
    if (!deployment) {
      throw new BadRequestException(
        'Worker has no active deployment — cannot mark attendance',
      );
    }

    const existing = await this.prisma.client.attendanceRecord.findUnique({
      where: { workerId_date: { workerId: input.workerId, date: input.date } },
    });

    const data = {
      workerId: input.workerId,
      factoryOrgId: deployment.factoryOrgId,
      agencyOrgId,
      date: input.date,
      status: input.status,
      overtime: input.overtime,
      markedBy: userId,
    };

    const record = existing
      ? await this.prisma.client.attendanceRecord.update({
          where: { id: existing.id },
          data,
        })
      : await this.prisma.client.attendanceRecord.create({ data });

    // Notify factory owner (best effort — find first OWNER in that factory).
    const owner = await this.prisma.client.user.findFirst({
      where: { orgId: deployment.factoryOrgId, role: 'OWNER' },
    });
    if (owner) {
      this.gateway.emitToUser(owner.id, 'attendance:marked', {
        workerId: input.workerId,
        date: input.date,
      });
    }
    this.gateway.emitToOrg(deployment.factoryOrgId, 'attendance:marked', {
      workerId: input.workerId,
    });

    return { id: record.id };
  }

  async list(
    orgId: string,
    role: 'factory' | 'agency',
    filters: { from?: Date; to?: Date; workerId?: string; onlyPending?: boolean },
  ): Promise<
    Array<{
      id: string;
      worker: { id: string; name: string };
      date: Date;
      status: AttendanceStatus;
      overtime: number;
      approvedAt: Date | null;
      isDisputed: boolean;
      disputeNote: string | null;
    }>
  > {
    const rows = await this.prisma.client.attendanceRecord.findMany({
      where: {
        ...(role === 'factory' ? { factoryOrgId: orgId } : { agencyOrgId: orgId }),
        ...(filters.from || filters.to
          ? {
              date: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
        ...(filters.workerId ? { workerId: filters.workerId } : {}),
        ...(filters.onlyPending ? { approvedBy: null } : {}),
      },
      include: { worker: { select: { id: true, name: true } } },
      orderBy: [{ date: 'desc' }, { worker: { name: 'asc' } }],
      take: 500,
    });

    return rows.map((r) => ({
      id: r.id,
      worker: r.worker,
      date: r.date,
      status: r.status as AttendanceStatus,
      overtime: r.overtime,
      approvedAt: r.approvedAt,
      isDisputed: r.isDisputed,
      disputeNote: r.disputeNote,
    }));
  }

  /**
   * Factory owner approves a batch of attendance records.
   * Produces a wages-accrual journal entry for the batch.
   */
  async approve(
    factoryOrgId: string,
    approverId: string,
    input: ApproveAttendanceInput,
  ): Promise<{ approved: number; totalWagesPaise: number }> {
    const records = await this.prisma.client.attendanceRecord.findMany({
      where: { id: { in: input.attendanceIds }, factoryOrgId, approvedBy: null },
      include: { worker: { select: { id: true, name: true, dailyRate: true } } },
    });

    if (records.length === 0) {
      throw new BadRequestException('No pending records to approve');
    }

    await this.prisma.client.attendanceRecord.updateMany({
      where: { id: { in: records.map((r) => r.id) } },
      data: { approvedBy: approverId, approvedAt: new Date() },
    });

    // Calculate total wages for the batch and write a journal entry.
    let totalWagesPaise = 0n;
    for (const r of records) {
      if (r.status === 'PRESENT') totalWagesPaise += r.worker.dailyRate;
      else if (r.status === 'HALF_DAY') totalWagesPaise += r.worker.dailyRate / 2n;
      // HALF_DAY is approximate — real payroll handles the exact split.
      if (r.overtime > 0) {
        const hourly = r.worker.dailyRate / 8n;
        totalWagesPaise += (hourly * 15n * BigInt(Math.floor(r.overtime))) / 10n;
      }
    }

    await this.accounting.onAttendanceApproved({
      orgId: factoryOrgId,
      totalWagesPaise,
      periodLabel: new Date().toISOString().slice(0, 10),
      date: new Date(),
    });

    // Notify the agency admin
    const agencyOrgId = records[0]?.agencyOrgId;
    if (agencyOrgId) {
      const agencyAdmin = await this.prisma.client.user.findFirst({
        where: { orgId: agencyOrgId, role: 'AGENCY_ADMIN' },
      });
      if (agencyAdmin) {
        await this.notifications.notifyUser({
          userId: agencyAdmin.id,
          orgId: agencyOrgId,
          type: 'ATTENDANCE_APPROVED',
          title: 'Attendance approved',
          body: `${records.length} record(s) approved by factory owner`,
          metadata: { count: records.length },
        });
      }
      this.gateway.emitToOrg(agencyOrgId, 'attendance:approved', {
        count: records.length,
      });
    }

    return { approved: records.length, totalWagesPaise: Number(totalWagesPaise) };
  }

  /**
   * Factory owner disputes an attendance record. The agency must re-mark it.
   */
  async dispute(
    factoryOrgId: string,
    input: DisputeAttendanceInput,
  ): Promise<{ id: string }> {
    const record = await this.prisma.client.attendanceRecord.findFirst({
      where: { id: input.attendanceId, factoryOrgId },
    });
    if (!record) throw new NotFoundException('Attendance record not found');

    await this.prisma.client.attendanceRecord.update({
      where: { id: record.id },
      data: {
        isDisputed: true,
        disputeNote: input.note,
        approvedBy: null,
        approvedAt: null,
      },
    });

    await this.notifications.notifyOrg({
      orgId: record.agencyOrgId,
      type: 'ATTENDANCE_DISPUTED',
      title: 'Attendance disputed',
      body: input.note,
      metadata: { attendanceId: record.id },
    });
    this.gateway.emitToOrg(record.agencyOrgId, 'attendance:disputed', {
      id: record.id,
    });

    return { id: record.id };
  }
}
