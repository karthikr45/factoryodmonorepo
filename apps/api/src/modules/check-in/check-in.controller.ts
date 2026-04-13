import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';

import { CheckInService } from './check-in.service';

@ApiBearerAuth()
@ApiTags('check-in')
@Controller('check-in')
export class CheckInController {
  constructor(private readonly checkInService: CheckInService) {}

  @Post('in')
  @ApiOperation({ summary: 'Worker checks in with optional GPS (admin marks for contract worker)' })
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

  // ---- Self check-in for factory direct employees ----

  @Post('me/in')
  @ApiOperation({ summary: 'Self check-in for factory direct employees' })
  async selfCheckIn(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { lat?: number; lng?: number; shiftType?: string },
  ): ReturnType<CheckInService['selfCheckIn']> {
    return this.checkInService.selfCheckIn(user.id, user.orgId, body);
  }

  @Post('me/out')
  @ApiOperation({ summary: 'Self check-out' })
  async selfCheckOut(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { lat?: number; lng?: number },
  ): ReturnType<CheckInService['selfCheckOut']> {
    return this.checkInService.selfCheckOut(user.id, user.orgId, body);
  }

  @Get('me/status')
  @ApiOperation({ summary: "Today's check-in status for the logged-in user" })
  async myStatus(@CurrentUser() user: AuthenticatedUser): ReturnType<CheckInService['myStatus']> {
    return this.checkInService.myStatus(user.id, user.orgId);
  }

  @Get('me/history')
  @ApiOperation({ summary: 'My attendance history for a month' })
  async myHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query('month') month: string,
    @Query('year') year: string,
  ): ReturnType<CheckInService['myHistory']> {
    const now = new Date();
    return this.checkInService.myHistory(
      user.id,
      Number(month ?? now.getMonth() + 1),
      Number(year ?? now.getFullYear()),
    );
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
  @ApiOperation({ summary: 'Worker check-in history (admin view)' })
  async history(
    @Query('workerId') workerId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): ReturnType<CheckInService['getWorkerHistory']> {
    return this.checkInService.getWorkerHistory(workerId, new Date(from), new Date(to));
  }
}
