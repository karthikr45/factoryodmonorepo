import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import {
  approveAttendanceSchema,
  disputeAttendanceSchema,
  markAttendanceSchema,
  type ApproveAttendanceInput,
  type DisputeAttendanceInput,
  type MarkAttendanceInput,
} from '@repo/validators';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

import { AttendanceService } from './attendance.service';

@ApiBearerAuth()
@ApiTags('attendance')
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @ApiOperation({ summary: 'Mark attendance (agency admin)' })
  @UsePipes(new ZodValidationPipe(markAttendanceSchema))
  async mark(
    @OrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: MarkAttendanceInput,
  ): ReturnType<AttendanceService['mark']> {
    return this.attendanceService.mark(orgId, user.id, body);
  }

  @Get()
  @ApiOperation({ summary: 'List attendance records for the current org' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'workerId', required: false })
  @ApiQuery({ name: 'onlyPending', required: false })
  @ApiQuery({ name: 'as', required: false, enum: ['factory', 'agency'] })
  async list(
    @OrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('workerId') workerId?: string,
    @Query('onlyPending') onlyPending?: string,
    @Query('as') as?: 'factory' | 'agency',
  ): ReturnType<AttendanceService['list']> {
    const role = as ?? (user.role === 'AGENCY_ADMIN' ? 'agency' : 'factory');
    return this.attendanceService.list(orgId, role, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      workerId,
      onlyPending: onlyPending === 'true',
    });
  }

  @Post('approve')
  @ApiOperation({ summary: 'Factory owner approves a batch of attendance rows' })
  @UsePipes(new ZodValidationPipe(approveAttendanceSchema))
  async approve(
    @OrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: ApproveAttendanceInput,
  ): ReturnType<AttendanceService['approve']> {
    return this.attendanceService.approve(orgId, user.id, body);
  }

  @Post('dispute')
  @ApiOperation({ summary: 'Factory owner disputes a record' })
  @UsePipes(new ZodValidationPipe(disputeAttendanceSchema))
  async dispute(
    @OrgId() orgId: string,
    @Body() body: DisputeAttendanceInput,
  ): ReturnType<AttendanceService['dispute']> {
    return this.attendanceService.dispute(orgId, body);
  }
}
