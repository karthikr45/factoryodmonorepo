import { BadRequestException, Body, Controller, Get, Header, Headers, HttpCode, HttpStatus, Param, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WorkersService } from '../workers/workers.service';

import { ContractWorkerPortalService } from './contract-worker-portal.service';

/**
 * Every endpoint here is `@Public()` w.r.t. the regular JWT guard — auth is
 * handled at the service layer via the worker-scoped JWT in the
 * `Authorization: Bearer <token>` header.
 */
@Public()
@ApiTags('contract-worker-portal')
@Controller('contract-worker-portal')
export class ContractWorkerPortalController {
  constructor(
    private readonly portal: ContractWorkerPortalService,
    private readonly workers: WorkersService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  request(@Body() body: { phone: string }): ReturnType<ContractWorkerPortalService['requestOtp']> {
    return this.portal.requestOtp(body?.phone ?? '');
  }

  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  verify(@Body() body: { phone: string; code: string }): ReturnType<ContractWorkerPortalService['verifyOtp']> {
    return this.portal.verifyOtp(body?.phone ?? '', body?.code ?? '');
  }

  @Get('me')
  @ApiOperation({ summary: 'Today\'s deployments + check-in status for the bearer worker' })
  async me(@Headers('authorization') auth: string): Promise<{
    workerId: string;
    deployments: Awaited<ReturnType<ContractWorkerPortalService['myDeployments']>>;
    today: Awaited<ReturnType<ContractWorkerPortalService['todayStatus']>>;
  }> {
    const { workerId } = await this.bearer(auth);
    const [deployments, today] = await Promise.all([
      this.portal.myDeployments(workerId),
      this.portal.todayStatus(workerId),
    ]);
    return { workerId, deployments, today };
  }

  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  async checkIn(
    @Headers('authorization') auth: string,
    @Body() body: { factoryOrgId: string; lat?: number; lng?: number },
  ): ReturnType<ContractWorkerPortalService['checkIn']> {
    const { workerId } = await this.bearer(auth);
    if (!body?.factoryOrgId) throw new BadRequestException('factoryOrgId is required');
    return this.portal.checkIn(workerId, body.factoryOrgId, body.lat, body.lng);
  }

  @Post('check-out')
  @HttpCode(HttpStatus.OK)
  async checkOut(
    @Headers('authorization') auth: string,
    @Body() body: { factoryOrgId: string; lat?: number; lng?: number },
  ): ReturnType<ContractWorkerPortalService['checkOut']> {
    const { workerId } = await this.bearer(auth);
    if (!body?.factoryOrgId) throw new BadRequestException('factoryOrgId is required');
    return this.portal.checkOut(workerId, body.factoryOrgId, body.lat, body.lng);
  }

  @Get('payslips')
  async slips(@Headers('authorization') auth: string): ReturnType<ContractWorkerPortalService['myPayslips']> {
    const { workerId } = await this.bearer(auth);
    return this.portal.myPayslips(workerId);
  }

  @Get('payslip/:id/pdf')
  @Header('Content-Type', 'application/pdf')
  async slipPdf(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const { workerId } = await this.bearer(auth);
    // Ensure this worker owns the payroll row.
    const row = await this.prisma.client.payroll.findFirst({
      where: { id, workerId },
      select: { id: true, agencyOrgId: true, factoryOrgId: true },
    });
    if (!row) throw new BadRequestException('Payslip not found');
    const { buffer, filename } = await this.workers.getPayrollSlipPdf(row.agencyOrgId, id);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', String(buffer.length));
    res.end(buffer);
  }

  @Post('attendance/:id/dispute')
  @HttpCode(HttpStatus.OK)
  async dispute(
    @Headers('authorization') auth: string,
    @Param('id') id: string,
    @Body() body: { note: string },
  ): ReturnType<ContractWorkerPortalService['disputeAttendance']> {
    const { workerId } = await this.bearer(auth);
    return this.portal.disputeAttendance(workerId, id, body?.note ?? '');
  }

  private async bearer(auth: string | undefined): Promise<{ workerId: string }> {
    const token = (auth ?? '').replace(/^Bearer\s+/i, '');
    if (!token) throw new BadRequestException('Missing Authorization header');
    return this.portal.identify(token);
  }
}
