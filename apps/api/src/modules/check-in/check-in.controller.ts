import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { OrgId } from '../../common/decorators/org-id.decorator';

import { CheckInService } from './check-in.service';

@ApiBearerAuth()
@ApiTags('check-in')
@Controller('check-in')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Post('in')
  @ApiOperation({ summary: 'Worker checks in with optional GPS' })
  async checkIn(
    @OrgId() orgId: string,
    @Body() body: { workerId: string; lat?: number; lng?: number; shiftType?: string },
  ): ReturnType<CheckInService['checkIn']> {
    return this.checkInService.checkIn(orgId, body);
  }

  @Post('out')
  @ApiOperation({ summary: 'Worker checks out with optional GPS' })
  async checkOut(
    @OrgId() orgId: string,
    @Body() body: { workerId: string; lat?: number; lng?: number },
  ): ReturnType<CheckInService['checkOut']> {
    return this.checkInService.checkOut(orgId, body);
  }

  @Get()
  @ApiOperation({ summary: 'List check-in/out records for a date' })
  async list(
    @OrgId() orgId: string,
    @Query('date') date?: string,
  ): ReturnType<CheckInService['listByFactory']> {
    const d = date ? new Date(date) : new Date();
    const today = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    return this.checkInService.listByFactory(orgId, today);
  }

  @Get('history')
  @ApiOperation({ summary: 'Worker check-in history' })
  async history(
    @Query('workerId') workerId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): ReturnType<CheckInService['getWorkerHistory']> {
    return this.checkInService.getWorkerHistory(workerId, new Date(from), new Date(to));
  }
}
