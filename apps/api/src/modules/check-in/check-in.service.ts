import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

interface CheckInInput {
  workerId: string;
  lat?: number;
  lng?: number;
  shiftType?: string;
}

interface CheckOutInput {
  workerId: string;
  lat?: number;
  lng?: number;
}

@Injectable()
export class CheckInService {
  private readonly SHIFT_START_HOUR = 9; // 9 AM IST

  constructor(private readonly prisma: PrismaService) {}

  async checkIn(factoryOrgId: string, input: CheckInInput): Promise<{
    id: string;
    isLate: boolean;
    checkInTime: Date;
  }> {
    const deployment = await this.prisma.client.workerDeployment.findFirst({
      where: { workerId: input.workerId, factoryOrgId, status: 'ACTIVE' },
    });
    if (!deployment) throw new BadRequestException('Worker has no active deployment at this factory');

    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const shift = (input.shiftType ?? 'GENERAL') as never;

    // IST is UTC+5:30 — check if late based on IST hour
    const istHour = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
    const isLate = istHour >= this.SHIFT_START_HOUR + 1; // 1 hour grace

    const existing = await this.prisma.client.checkInOut.findUnique({
      where: { workerId_date_shiftType: { workerId: input.workerId, date: today, shiftType: shift } },
    });

    if (existing?.checkInTime) {
      throw new BadRequestException('Already checked in today');
    }

    const record = existing
      ? await this.prisma.client.checkInOut.update({
          where: { id: existing.id },
          data: { checkInTime: now, checkInLat: input.lat, checkInLng: input.lng, isLate },
        })
      : await this.prisma.client.checkInOut.create({
          data: {
            workerId: input.workerId,
            factoryOrgId,
            date: today,
            checkInTime: now,
            checkInLat: input.lat,
            checkInLng: input.lng,
            shiftType: shift,
            isLate,
          },
        });

    return { id: record.id, isLate, checkInTime: now };
  }

  async checkOut(factoryOrgId: string, input: CheckOutInput): Promise<{
    id: string;
    totalHours: number;
    isEarlyLeave: boolean;
  }> {
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const record = await this.prisma.client.checkInOut.findFirst({
      where: {
        workerId: input.workerId,
        factoryOrgId,
        date: today,
        checkInTime: { not: null },
        checkOutTime: null,
      },
    });

    if (!record || !record.checkInTime) {
      throw new BadRequestException('No active check-in found for today');
    }

    const totalMs = now.getTime() - record.checkInTime.getTime();
    const totalHours = Math.round((totalMs / 3_600_000) * 100) / 100;
    const isEarlyLeave = totalHours < 7;

    await this.prisma.client.checkInOut.update({
      where: { id: record.id },
      data: {
        checkOutTime: now,
        checkOutLat: input.lat,
        checkOutLng: input.lng,
        totalHours,
        isEarlyLeave,
      },
    });

    return { id: record.id, totalHours, isEarlyLeave };
  }

  async listByFactory(
    factoryOrgId: string,
    date: Date,
  ): Promise<Array<{
    id: string;
    worker: { id: string; name: string; skill: string };
    checkInTime: Date | null;
    checkOutTime: Date | null;
    totalHours: number | null;
    isLate: boolean;
    isEarlyLeave: boolean;
    shiftType: string;
  }>> {
    const rows = await this.prisma.client.checkInOut.findMany({
      where: { factoryOrgId, date },
      include: { worker: { select: { id: true, name: true, skill: true } } },
      orderBy: { checkInTime: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      worker: r.worker,
      checkInTime: r.checkInTime,
      checkOutTime: r.checkOutTime,
      totalHours: r.totalHours,
      isLate: r.isLate,
      isEarlyLeave: r.isEarlyLeave,
      shiftType: r.shiftType,
    }));
  }

  async getWorkerHistory(workerId: string, from: Date, to: Date): Promise<Array<{
    date: Date;
    checkInTime: Date | null;
    checkOutTime: Date | null;
    totalHours: number | null;
    isLate: boolean;
  }>> {
    const rows = await this.prisma.client.checkInOut.findMany({
      where: { workerId, date: { gte: from, lte: to } },
      orderBy: { date: 'desc' },
    });
    return rows.map((r) => ({
      date: r.date,
      checkInTime: r.checkInTime,
      checkOutTime: r.checkOutTime,
      totalHours: r.totalHours,
      isLate: r.isLate,
    }));
  }
}
