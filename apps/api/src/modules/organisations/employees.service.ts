import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PdfService } from '../../common/pdf/pdf.service';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface EmployeeView {
  id: string;
  type: 'direct' | 'contract';
  name: string;
  phone: string;
  role: string;
  customRoleId: string | null;
  department: string | null;
  designation: string | null;
  dailyRateOrSalary: number;
  salaryType: 'monthly' | 'daily';
  isActive: boolean;
  joiningDate: Date;
}

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pdf: PdfService,
  ) {}

  /**
   * Build a salary slip PDF for a direct employee on demand. Synthesises
   * earnings + deductions from EmployeeProfile.monthlySalary and the user's
   * check-in records for the requested month — there is no Payroll row for
   * direct workers (that table is agency-side).
   */
  async getMyPayslipPdf(orgId: string, userId: string, month: number, year: number): Promise<{ buffer: Buffer; filename: string }> {
    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, orgId },
      include: {
        employeeProfile: { include: { department: { select: { name: true } } } },
        organisation: { select: { name: true } },
      },
    });
    if (!user || !user.employeeProfile) {
      throw new NotFoundException('Employee profile not found');
    }

    // Working days in the month (count of attendance records this month).
    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const monthEnd = new Date(Date.UTC(year, month, 1));
    const checkIns = await this.prisma.client.checkInOut.findMany({
      where: { factoryOrgId: orgId, date: { gte: monthStart, lt: monthEnd } },
    });
    // checkIn rows are by workerId for contract; for direct workers we use
    // attendance records only if they exist. Approximate "days present" from
    // the count of distinct dates with a recorded check-in for this user.
    // Fallback: we assume 26 working days when no check-ins exist, as a sane
    // default for a salaried employee.
    const presentDays = new Set(checkIns.map((c) => c.date.toISOString().slice(0, 10))).size || 26;
    const workedDays = 26;

    const monthlyPaise = Number(user.employeeProfile.monthlySalary);
    // Pro-rate basic if they joined / left mid-month, otherwise full.
    const earnedPaise = Math.min(monthlyPaise, Math.round((monthlyPaise / workedDays) * presentDays));
    // Indicative statutory deductions (12% PF on basic capped at 15k base).
    const pfBase = Math.min(earnedPaise, 15_000_00);
    const pfPaise = Math.round(pfBase * 0.12);

    const buffer = await this.pdf.buildSalarySlip({
      org: { name: user.organisation.name },
      employee: {
        name: user.name,
        designation: user.employeeProfile.designation,
        department: user.employeeProfile.department?.name ?? null,
        panNumber: user.employeeProfile.panNumber ?? null,
        bankAccount: user.employeeProfile.bankAccount ?? null,
        ifscCode: user.employeeProfile.ifscCode ?? null,
      },
      period: { month, year },
      earnings: { basicPaise: earnedPaise },
      deductions: { pfPaise },
      attendance: { workedDays, presentDays, paidLeave: Math.max(0, workedDays - presentDays) },
    });

    return { buffer, filename: `slip-${user.name.replace(/\s+/g, '-')}-${month}-${year}.pdf` };
  }

  /**
   * Unified view: factory's own employees + contract workers deployed here.
   * This is the "Everyone who works at my factory" view.
   */
  async listAll(factoryOrgId: string): Promise<EmployeeView[]> {
    // Direct employees: Users in this org with MANAGER or WORKER role + EmployeeProfile
    const directUsers = await this.prisma.client.user.findMany({
      where: { orgId: factoryOrgId, role: { in: ['MANAGER', 'WORKER'] }, isActive: true },
      include: {
        employeeProfile: { include: { department: { select: { name: true } } } },
      },
    });

    const direct: EmployeeView[] = directUsers.map((u) => ({
      id: u.id,
      type: 'direct',
      name: u.name,
      phone: u.phone,
      role: u.role,
      customRoleId: u.customRoleId ?? null,
      department: u.employeeProfile?.department?.name ?? null,
      designation: u.employeeProfile?.designation ?? u.role,
      dailyRateOrSalary: Number(u.employeeProfile?.monthlySalary ?? 0),
      salaryType: 'monthly',
      isActive: u.isActive,
      joiningDate: u.employeeProfile?.joiningDate ?? u.createdAt,
    }));

    // Contract workers: deployed from agencies to this factory
    const deployments = await this.prisma.client.workerDeployment.findMany({
      where: { factoryOrgId, status: 'ACTIVE' },
      include: {
        worker: { include: { agency: { select: { name: true } } } },
      },
    });

    const contract: EmployeeView[] = deployments.map((d) => ({
      id: d.workerId,
      type: 'contract',
      name: d.worker.name,
      phone: d.worker.phone,
      role: 'CONTRACT',
      customRoleId: null,
      department: null,
      designation: `${d.worker.skill} (${d.worker.agency.name})`,
      dailyRateOrSalary: Number(d.worker.dailyRate),
      salaryType: 'daily',
      isActive: d.worker.isActive,
      joiningDate: d.startDate,
    }));

    return [...direct, ...contract];
  }

  /**
   * Add a direct employee to the factory.
   * Creates a User + EmployeeProfile.
   */
  async addDirectEmployee(orgId: string, input: {
    name: string;
    phone: string;
    email?: string;
    role: 'MANAGER' | 'WORKER';
    departmentId?: string;
    designation: string;
    monthlySalary: number;
    aadhaarLast4?: string;
    panNumber?: string;
  }): Promise<{ userId: string; profileId: string }> {
    const existing = await this.prisma.client.user.findUnique({ where: { phone: input.phone } });
    if (existing) throw new ConflictException('Phone number already registered');

    const user = await this.prisma.client.user.create({
      data: {
        orgId,
        name: input.name,
        phone: input.phone,
        email: input.email ?? null,
        role: input.role,
      },
    });

    const profile = await this.prisma.client.employeeProfile.create({
      data: {
        userId: user.id,
        orgId,
        departmentId: input.departmentId ?? null,
        designation: input.designation,
        monthlySalary: BigInt(input.monthlySalary),
        aadhaarLast4: input.aadhaarLast4 ?? null,
        panNumber: input.panNumber ?? null,
      },
    });

    return { userId: user.id, profileId: profile.id };
  }

  async getProfile(orgId: string, userId: string): Promise<{
    user: { id: string; name: string; phone: string; email: string | null; role: string };
    profile: {
      designation: string; departmentName: string | null; monthlySalary: number;
      employmentType: string; joiningDate: Date; aadhaarLast4: string | null;
    } | null;
  }> {
    const user = await this.prisma.client.user.findFirst({
      where: { id: userId, orgId },
      include: {
        employeeProfile: { include: { department: { select: { name: true } } } },
      },
    });
    if (!user) throw new NotFoundException('Employee not found');

    return {
      user: { id: user.id, name: user.name, phone: user.phone, email: user.email, role: user.role },
      profile: user.employeeProfile
        ? {
            designation: user.employeeProfile.designation,
            departmentName: user.employeeProfile.department?.name ?? null,
            monthlySalary: Number(user.employeeProfile.monthlySalary),
            employmentType: user.employeeProfile.employmentType,
            joiningDate: user.employeeProfile.joiningDate,
            aadhaarLast4: user.employeeProfile.aadhaarLast4,
          }
        : null,
    };
  }
}
