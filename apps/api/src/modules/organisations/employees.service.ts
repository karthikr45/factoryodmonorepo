import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

export interface EmployeeView {
  id: string;
  type: 'direct' | 'contract';
  name: string;
  phone: string;
  role: string;
  department: string | null;
  designation: string | null;
  dailyRateOrSalary: number;
  salaryType: 'monthly' | 'daily';
  isActive: boolean;
  joiningDate: Date;
}

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

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
