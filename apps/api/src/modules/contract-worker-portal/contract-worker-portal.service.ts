import { createHash, randomInt } from 'node:crypto';

import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../../common/prisma/prisma.service';
import { TwilioService } from '../auth/twilio.service';

const TOKEN_TTL = '12h';
const TOKEN_AUD = 'contract-worker';

interface ContractWorkerPayload {
  sub: string;       // workerId
  phone: string;
  aud: typeof TOKEN_AUD;
}

/**
 * Lite portal for staffing-agency-deployed contract workers. They identify
 * themselves with phone + OTP (matched against the Worker table), get a
 * scoped JWT, and can mark check-in/out at any factory they're deployed to.
 *
 * The JWT is intentionally narrow (audience='contract-worker') so it can't
 * be reused on regular user-bound endpoints.
 */
@Injectable()
export class ContractWorkerPortalService {
  private readonly logger = new Logger(ContractWorkerPortalService.name);
  private readonly OTP_TTL_MS = 10 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly twilio: TwilioService,
  ) {}

  async requestOtp(phone: string): Promise<{ expiresAt: Date }> {
    const normalised = this.normalisePhone(phone);
    if (!normalised) throw new BadRequestException('Phone must be a valid 10-digit Indian mobile number');

    const worker = await this.prisma.client.worker.findFirst({ where: { phone: normalised, isActive: true } });
    if (!worker) {
      // Don't reveal that the phone isn't registered — still pretend to send so
      // bad actors can't enumerate worker phone numbers.
      this.logger.warn(`OTP requested for unknown contract worker ${normalised}`);
      return { expiresAt: new Date(Date.now() + this.OTP_TTL_MS) };
    }

    const code = randomInt(100_000, 1_000_000).toString();
    const hash = this.hashOtp(code);
    const expiresAt = new Date(Date.now() + this.OTP_TTL_MS);
    await this.prisma.client.oTP.create({ data: { phone: normalised, code: hash, expiresAt, used: false } });
    await this.twilio.sendOtp(normalised, code);
    return { expiresAt };
  }

  async verifyOtp(phone: string, code: string): Promise<{
    accessToken: string;
    expiresIn: number;
    worker: { id: string; name: string; skill: string; phone: string };
  }> {
    const normalised = this.normalisePhone(phone);
    if (!normalised) throw new UnauthorizedException('Invalid phone');
    const hash = this.hashOtp(code);
    const record = await this.prisma.client.oTP.findFirst({
      where: { phone: normalised, code: hash, used: false, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!record) throw new UnauthorizedException('Invalid or expired code');

    await this.prisma.client.oTP.update({ where: { id: record.id }, data: { used: true } });

    const worker = await this.prisma.client.worker.findFirst({ where: { phone: normalised, isActive: true } });
    if (!worker) throw new UnauthorizedException('You are not registered as a contract worker. Ask your agency to add you.');

    const payload: ContractWorkerPayload = { sub: worker.id, phone: normalised, aud: TOKEN_AUD };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
      expiresIn: TOKEN_TTL,
    });

    return {
      accessToken,
      expiresIn: 12 * 3600,
      worker: { id: worker.id, name: worker.name, skill: worker.skill, phone: worker.phone },
    };
  }

  /**
   * Verifies a contract-worker JWT and returns the workerId. Throws
   * UnauthorizedException on any problem so callers can `await this.identify(token)`
   * at the top of every handler.
   */
  async identify(token: string): Promise<{ workerId: string; phone: string }> {
    let payload: ContractWorkerPayload;
    try {
      payload = await this.jwt.verifyAsync<ContractWorkerPayload>(token, {
        secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
        audience: TOKEN_AUD,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return { workerId: payload.sub, phone: payload.phone };
  }

  async myDeployments(workerId: string): Promise<Array<{ id: string; factoryName: string; factoryOrgId: string; startDate: Date }>> {
    const rows = await this.prisma.client.workerDeployment.findMany({
      where: { workerId, status: 'ACTIVE' },
      include: { factory: { select: { id: true, name: true } } },
    });
    return rows.map((d) => ({ id: d.id, factoryName: d.factory.name, factoryOrgId: d.factory.id, startDate: d.startDate }));
  }

  async todayStatus(workerId: string): Promise<Array<{
    factoryOrgId: string; factoryName: string;
    checkedIn: boolean; checkInTime: Date | null; checkOutTime: Date | null;
  }>> {
    const deployments = await this.myDeployments(workerId);
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const out: Array<{ factoryOrgId: string; factoryName: string; checkedIn: boolean; checkInTime: Date | null; checkOutTime: Date | null }> = [];
    for (const d of deployments) {
      const rec = await this.prisma.client.checkInOut.findFirst({
        where: { workerId, factoryOrgId: d.factoryOrgId, date: today },
      });
      out.push({
        factoryOrgId: d.factoryOrgId,
        factoryName: d.factoryName,
        checkedIn: !!rec?.checkInTime && !rec?.checkOutTime,
        checkInTime: rec?.checkInTime ?? null,
        checkOutTime: rec?.checkOutTime ?? null,
      });
    }
    return out;
  }

  async checkIn(workerId: string, factoryOrgId: string, lat?: number, lng?: number): Promise<{ id: string; checkInTime: Date }> {
    const deployment = await this.prisma.client.workerDeployment.findFirst({
      where: { workerId, factoryOrgId, status: 'ACTIVE' },
    });
    if (!deployment) throw new BadRequestException('You are not deployed to this factory');

    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const existing = await this.prisma.client.checkInOut.findFirst({ where: { workerId, factoryOrgId, date: today } });
    if (existing?.checkInTime) throw new BadRequestException('You are already checked in for today');

    const now = new Date();
    const istHour = (now.getUTCHours() + 5 + Math.floor((now.getUTCMinutes() + 30) / 60)) % 24;
    const isLate = istHour >= 10; // 9am shift + 1 hour grace

    const record = existing
      ? await this.prisma.client.checkInOut.update({
          where: { id: existing.id },
          data: { checkInTime: now, checkInLat: lat, checkInLng: lng, isLate },
        })
      : await this.prisma.client.checkInOut.create({
          data: { workerId, factoryOrgId, date: today, checkInTime: now, checkInLat: lat, checkInLng: lng, isLate, shiftType: 'GENERAL' as never },
        });

    return { id: record.id, checkInTime: now };
  }

  async checkOut(workerId: string, factoryOrgId: string, lat?: number, lng?: number): Promise<{ id: string; checkOutTime: Date; totalHours: number }> {
    const today = new Date(); today.setUTCHours(0, 0, 0, 0);
    const record = await this.prisma.client.checkInOut.findFirst({
      where: { workerId, factoryOrgId, date: today, checkInTime: { not: null }, checkOutTime: null },
    });
    if (!record || !record.checkInTime) throw new BadRequestException('You have not checked in today');
    const now = new Date();
    const totalHours = Math.round(((now.getTime() - record.checkInTime.getTime()) / 3_600_000) * 100) / 100;
    await this.prisma.client.checkInOut.update({
      where: { id: record.id },
      data: { checkOutTime: now, checkOutLat: lat, checkOutLng: lng, totalHours },
    });
    return { id: record.id, checkOutTime: now, totalHours };
  }

  async myPayslips(workerId: string): Promise<Array<{ id: string; period: string; netRupees: number; status: string; pdfUrl: string }>> {
    const rows = await this.prisma.client.payroll.findMany({
      where: { workerId },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 12,
    });
    return rows.map((p) => ({
      id: p.id,
      period: `${String(p.month).padStart(2, '0')}/${p.year}`,
      netRupees: Number(p.netAmount) / 100,
      status: p.status,
      pdfUrl: `/api/contract-worker-portal/payslip/${p.id}/pdf`,
    }));
  }

  /**
   * Worker-side dispute. Marks the AttendanceRecord as disputed and notifies
   * both the agency and the factory.
   */
  async disputeAttendance(workerId: string, attendanceId: string, note: string): Promise<{ ok: true }> {
    const rec = await this.prisma.client.attendanceRecord.findFirst({
      where: { id: attendanceId, workerId },
    });
    if (!rec) throw new NotFoundException('Attendance record not found');
    if (!note || note.trim().length < 5) throw new BadRequestException('Please describe the issue in at least 5 characters');

    await this.prisma.client.attendanceRecord.update({
      where: { id: rec.id },
      data: {
        isDisputed: true,
        disputeNote: `[Worker] ${note.trim()}`,
        approvedBy: null,
        approvedAt: null,
      },
    });
    return { ok: true };
  }

  // -- internals --

  private hashOtp(code: string): string {
    const salt = process.env.JWT_SECRET ?? 'dev-secret-change-me';
    return createHash('sha256').update(`${salt}:${code}`).digest('hex');
  }

  private normalisePhone(raw: string): string | null {
    const digits = (raw ?? '').replace(/\D/g, '');
    if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
    if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    if (raw?.startsWith('+91') && /^\+91[6-9]\d{9}$/.test(raw)) return raw;
    return null;
  }
}
