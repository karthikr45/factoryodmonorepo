import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import {
  inviteMemberSchema,
  onboardOrganisationSchema,
  updateOrganisationSchema,
  type InviteMemberInput,
  type OnboardOrganisationInput,
  type UpdateOrganisationInput,
} from '@repo/validators';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

import { EmployeesService } from './employees.service';
import { OrganisationsService } from './organisations.service';

@ApiBearerAuth()
@ApiTags('organisations')
@Controller('organisations')
export class OrganisationsController {
  constructor(
    private readonly organisationsService: OrganisationsService,
    private readonly employeesService: EmployeesService,
  ) {}

  @Post('onboard')
  @ApiOperation({ summary: 'Complete first-time organisation onboarding' })
  @UsePipes(new ZodValidationPipe(onboardOrganisationSchema))
  async onboard(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: OnboardOrganisationInput,
  ): ReturnType<OrganisationsService['onboard']> {
    return this.organisationsService.onboard(user.id, user.orgId, body);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get the current organisation details' })
  async current(@OrgId() orgId: string): ReturnType<OrganisationsService['getCurrent']> {
    return this.organisationsService.getCurrent(orgId);
  }

  @Patch('current')
  @ApiOperation({ summary: 'Update current organisation settings' })
  @UsePipes(new ZodValidationPipe(updateOrganisationSchema))
  async update(
    @OrgId() orgId: string,
    @Body() body: UpdateOrganisationInput,
  ): ReturnType<OrganisationsService['update']> {
    return this.organisationsService.update(orgId, body);
  }

  @Get('members')
  @ApiOperation({ summary: 'List all members of the organisation' })
  async listMembers(
    @OrgId() orgId: string,
  ): ReturnType<OrganisationsService['listMembers']> {
    return this.organisationsService.listMembers(orgId);
  }

  @Post('members')
  @ApiOperation({ summary: 'Invite a new member by phone number' })
  @UsePipes(new ZodValidationPipe(inviteMemberSchema))
  async invite(
    @OrgId() orgId: string,
    @Body() body: InviteMemberInput,
  ): ReturnType<OrganisationsService['inviteMember']> {
    return this.organisationsService.inviteMember(orgId, body);
  }

  @Delete('members/:id')
  @ApiOperation({ summary: 'Deactivate a member' })
  async deactivate(
    @OrgId() orgId: string,
    @Param('id') id: string,
  ): ReturnType<OrganisationsService['deactivateMember']> {
    return this.organisationsService.deactivateMember(orgId, id);
  }

  // ---- Employees (unified view: direct + contract) ----
  @Get('employees')
  @ApiOperation({ summary: 'All people working at this factory (direct + contract)' })
  async listAllEmployees(
    @OrgId() orgId: string,
  ): ReturnType<EmployeesService['listAll']> {
    return this.employeesService.listAll(orgId);
  }

  @Post('employees')
  @ApiOperation({ summary: 'Add a direct employee to the factory' })
  async addEmployee(
    @OrgId() orgId: string,
    @Body() body: {
      name: string; phone: string; email?: string; role: 'MANAGER' | 'WORKER';
      departmentId?: string; designation: string; monthlySalary: number;
      aadhaarLast4?: string; panNumber?: string;
    },
  ): ReturnType<EmployeesService['addDirectEmployee']> {
    return this.employeesService.addDirectEmployee(orgId, body);
  }

  @Get('employees/:id')
  @ApiOperation({ summary: 'Get employee profile (direct employee)' })
  async getEmployee(
    @OrgId() orgId: string,
    @Param('id') id: string,
  ): ReturnType<EmployeesService['getProfile']> {
    return this.employeesService.getProfile(orgId, id);
  }

  @Get('employees/me/profile')
  @ApiOperation({ summary: 'My own employee profile (direct employees only)' })
  async myProfile(
    @OrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ReturnType<EmployeesService['getProfile']> {
    return this.employeesService.getProfile(orgId, user.id);
  }

  @Get('employees/me/payslip.pdf')
  @Header('Content-Type', 'application/pdf')
  @ApiOperation({ summary: 'On-the-fly salary slip for the current direct employee' })
  async myPayslip(
    @OrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('month') month: string,
    @Query('year') year: string,
    @Res() res: Response,
  ): Promise<void> {
    const m = Number(month);
    const y = Number(year);
    const { buffer, filename } = await this.employeesService.getMyPayslipPdf(orgId, user.id, m, y);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', String(buffer.length));
    res.end(buffer);
  }
}
