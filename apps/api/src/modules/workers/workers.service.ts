import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import type {
  CreateWorkerInput,
  DeployWorkerInput,
  UpdateWorkerInput,
} from '@repo/validators';

import { AccountingService } from '../../common/accounting/accounting.service';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface WorkerListItem {
  id: string;
  name: string;
  phone: string;
  skill: string;
  dailyRate: number;
  isActive: boolean;
  aadhaarLast4: string;
}

@Injectable()
export class WorkersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accounting: AccountingService,
  ) {}

  // ---- Workers master (agency side) ----

  async list(agencyOrgId: string, activeOnly = true): Promise<WorkerListItem[]> {
    const rows = await this.prisma.client.worker.findMany({
      where: { agencyOrgId, ...(activeOnly ? { isActive: true } : {}) },
      orderBy: { name: 'asc' },
    });
    return rows.map((w) => ({
      id: w.id,
      name: w.name,
      phone: w.phone,
      skill: w.skill,
      dailyRate: Number(w.dailyRate),
      isActive: w.isActive,
      aadhaarLast4: w.aadhaarLast4,
    }));
  }

  async create(agencyOrgId: string, input: CreateWorkerInput): Promise<{ id: string }> {
    const worker = await this.prisma.client.worker.create({
      data: {
        agencyOrgId,
        name: input.name,
        phone: input.phone,
        aadhaarLast4: input.aadhaarLast4,
        skill: input.skill,
        dailyRate: BigInt(input.dailyRate),
        epfNumber: input.epfNumber ?? null,
        esicNumber: input.esicNumber ?? null,
      },
    });
    return { id: worker.id };
  }

  async update(
    agencyOrgId: string,
    id: string,
    input: UpdateWorkerInput,
  ): Promise<{ id: string }> {
    const existing = await this.prisma.client.worker.findFirst({
      where: { id, agencyOrgId },
    });
    if (!existing) throw new NotFoundException('Worker not found');

    await this.prisma.client.worker.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.skill !== undefined ? { skill: input.skill } : {}),
        ...(input.dailyRate !== undefined
          ? { dailyRate: BigInt(input.dailyRate) }
          : {}),
        ...(input.epfNumber !== undefined ? { epfNumber: input.epfNumber } : {}),
        ...(input.esicNumber !== undefined ? { esicNumber: input.esicNumber } : {}),
      },
    });
    return { id };
  }

  // ---- Deployments ----

  async deploy(
    agencyOrgId: string,
    input: DeployWorkerInput,
  ): Promise<{ id: string }> {
    const worker = await this.prisma.client.worker.findFirst({
      where: { id: input.workerId, agencyOrgId },
    });
    if (!worker) throw new BadRequestException('Worker not in this agency');

    // End any active deployment first.
    await this.prisma.client.workerDeployment.updateMany({
      where: { workerId: input.workerId, status: 'ACTIVE' },
      data: { status: 'COMPLETED', endDate: new Date() },
    });

    const d = await this.prisma.client.workerDeployment.create({
      data: {
        workerId: input.workerId,
        factoryOrgId: input.factoryOrgId,
        agencyOrgId,
        startDate: input.startDate,
        endDate: input.endDate ?? null,
        status: 'ACTIVE',
      },
    });
    return { id: d.id };
  }

  async listDeployments(orgId: string, role: 'factory' | 'agency'): Promise<
    Array<{
      id: string;
      worker: { id: string; name: string; skill: string };
      factoryOrgId: string;
      agencyOrgId: string;
      startDate: Date;
      endDate: Date | null;
      status: string;
    }>
  > {
    const rows = await this.prisma.client.workerDeployment.findMany({
      where: role === 'factory' ? { factoryOrgId: orgId } : { agencyOrgId: orgId },
      include: {
        worker: { select: { id: true, name: true, skill: true } },
      },
      orderBy: { startDate: 'desc' },
      take: 500,
    });
    return rows.map((d) => ({
      id: d.id,
      worker: d.worker,
      factoryOrgId: d.factoryOrgId,
      agencyOrgId: d.agencyOrgId,
      startDate: d.startDate,
      endDate: d.endDate,
      status: d.status,
    }));
  }

  // ---- Payroll ----

  /**
   * Generate a payroll row for every deployed worker for the given month.
   * Uses approved attendance only. EPF = 12%, ESIC = 1.75% (indicative).
   */
  async generatePayroll(
    agencyOrgId: string,
    month: number,
    year: number,
  ): Promise<{ created: number; skipped: number }> {
    const deployments = await this.prisma.client.workerDeployment.findMany({
      where: { agencyOrgId, status: 'ACTIVE' },
      include: { worker: true },
    });

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 1));

    let created = 0;
    let skipped = 0;
    for (const d of deployments) {
      // Skip if payroll for this worker/month already exists
      const existing = await this.prisma.client.payroll.findUnique({
        where: { workerId_month_year: { workerId: d.workerId, month, year } },
      });
      if (existing) {
        skipped++;
        continue;
      }

      const records = await this.prisma.client.attendanceRecord.findMany({
        where: {
          workerId: d.workerId,
          approvedBy: { not: null },
          date: { gte: monthStart, lt: monthEnd },
        },
      });

      const daysPresent = records.filter((r) => r.status === 'PRESENT').length;
      const daysHalf = records.filter((r) => r.status === 'HALF_DAY').length;
      const daysAbsent = records.filter((r) => r.status === 'ABSENT').length;
      const overtimeHours = records.reduce((a, r) => a + r.overtime, 0);

      const effectiveDays = daysPresent + daysHalf * 0.5;
      const basicPaise = BigInt(Math.round(effectiveDays * Number(d.worker.dailyRate)));
      const otPaise = BigInt(
        Math.round((Number(d.worker.dailyRate) / 8) * 1.5 * overtimeHours),
      );
      const grossPaise = basicPaise + otPaise;

      const epfPaise = (grossPaise * 12n) / 100n;
      const esicPaise = (grossPaise * 175n) / 10_000n;
      const netPaise = grossPaise - epfPaise - esicPaise;

      await this.prisma.client.payroll.create({
        data: {
          workerId: d.workerId,
          agencyOrgId,
          factoryOrgId: d.factoryOrgId,
          month,
          year,
          daysPresent,
          daysAbsent,
          overtimeHours,
          basicAmount: grossPaise,
          epfDeduction: epfPaise,
          esicDeduction: esicPaise,
          netAmount: netPaise,
          status: 'DRAFT',
        },
      });
      created++;
    }

    return { created, skipped };
  }

  async listPayroll(
    orgId: string,
    role: 'factory' | 'agency',
    month: number,
    year: number,
  ): Promise<
    Array<{
      id: string;
      worker: { id: string; name: string };
      daysPresent: number;
      daysAbsent: number;
      overtimeHours: number;
      basicAmount: number;
      epfDeduction: number;
      esicDeduction: number;
      netAmount: number;
      status: string;
    }>
  > {
    const rows = await this.prisma.client.payroll.findMany({
      where: {
        month,
        year,
        ...(role === 'factory' ? { factoryOrgId: orgId } : { agencyOrgId: orgId }),
      },
      include: { worker: { select: { id: true, name: true } } },
      orderBy: { worker: { name: 'asc' } },
    });
    return rows.map((p) => ({
      id: p.id,
      worker: p.worker,
      daysPresent: p.daysPresent,
      daysAbsent: p.daysAbsent,
      overtimeHours: p.overtimeHours,
      basicAmount: Number(p.basicAmount),
      epfDeduction: Number(p.epfDeduction),
      esicDeduction: Number(p.esicDeduction),
      netAmount: Number(p.netAmount),
      status: p.status,
    }));
  }

  /**
   * Mark a payroll row as paid → trigger journal entries in the FACTORY org
   * (the factory is the one paying, not the agency).
   */
  async markPayrollPaid(agencyOrgId: string, id: string): Promise<{ id: string }> {
    const payroll = await this.prisma.client.payroll.findFirst({
      where: { id, agencyOrgId },
    });
    if (!payroll) throw new NotFoundException('Payroll row not found');
    if (payroll.status === 'PAID') {
      throw new BadRequestException('Already paid');
    }

    await this.prisma.client.payroll.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() },
    });

    await this.accounting.onPayrollPaid({
      orgId: payroll.factoryOrgId,
      netPaise: payroll.netAmount,
      epfPaise: payroll.epfDeduction,
      esicPaise: payroll.esicDeduction,
      date: new Date(),
      month: payroll.month,
      year: payroll.year,
    });

    return { id };
  }
}
