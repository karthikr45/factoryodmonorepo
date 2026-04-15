import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import {
  createWorkerSchema,
  deployWorkerSchema,
  updateWorkerSchema,
  type CreateWorkerInput,
  type DeployWorkerInput,
  type UpdateWorkerInput,
} from '@repo/validators';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

import { WorkersService } from './workers.service';

@ApiBearerAuth()
@ApiTags('workers')
@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  @Get()
  @ApiOperation({ summary: 'List workers (agency-scoped)' })
  async list(@OrgId() orgId: string): ReturnType<WorkersService['list']> {
    return this.workersService.list(orgId);
  }

  @Post()
  @UsePipes(new ZodValidationPipe(createWorkerSchema))
  async create(
    @OrgId() orgId: string,
    @Body() body: CreateWorkerInput,
  ): ReturnType<WorkersService['create']> {
    return this.workersService.create(orgId, body);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateWorkerSchema))
  async update(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() body: UpdateWorkerInput,
  ): ReturnType<WorkersService['update']> {
    return this.workersService.update(orgId, id, body);
  }

  @Post('deployments')
  @ApiOperation({ summary: 'Deploy a worker to a factory' })
  @UsePipes(new ZodValidationPipe(deployWorkerSchema))
  async deploy(
    @OrgId() orgId: string,
    @Body() body: DeployWorkerInput,
  ): ReturnType<WorkersService['deploy']> {
    return this.workersService.deploy(orgId, body);
  }

  @Get('deployments')
  @ApiQuery({ name: 'as', required: false, enum: ['factory', 'agency'] })
  async listDeployments(
    @OrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('as') as?: 'factory' | 'agency',
  ): ReturnType<WorkersService['listDeployments']> {
    const role = as ?? (user.role === 'AGENCY_ADMIN' ? 'agency' : 'factory');
    return this.workersService.listDeployments(orgId, role);
  }

  // ---- Payroll ----
  @Post('payroll/generate')
  @ApiOperation({ summary: 'Generate payroll for a month (agency admin)' })
  async generatePayroll(
    @OrgId() orgId: string,
    @Body() body: { month: number; year: number },
  ): ReturnType<WorkersService['generatePayroll']> {
    return this.workersService.generatePayroll(orgId, body.month, body.year);
  }

  @Get('payroll')
  async listPayroll(
    @OrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('month') month: string,
    @Query('year') year: string,
    @Query('as') as?: 'factory' | 'agency',
  ): ReturnType<WorkersService['listPayroll']> {
    const role = as ?? (user.role === 'AGENCY_ADMIN' ? 'agency' : 'factory');
    return this.workersService.listPayroll(orgId, role, Number(month), Number(year));
  }

  @Post('payroll/:id/pay')
  async markPaid(
    @OrgId() orgId: string,
    @Param('id') id: string,
  ): ReturnType<WorkersService['markPayrollPaid']> {
    return this.workersService.markPayrollPaid(orgId, id);
  }

  @Get('payroll/:id/slip.pdf')
  @Header('Content-Type', 'application/pdf')
  async salarySlipPdf(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { buffer, filename } = await this.workersService.getPayrollSlipPdf(orgId, id);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', String(buffer.length));
    res.end(buffer);
  }
}
