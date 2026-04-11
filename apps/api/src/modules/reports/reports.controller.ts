import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';

import { ReportsService } from './reports.service';

@ApiBearerAuth()
@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Top-line numbers for the home dashboard' })
  async dashboard(
    @OrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): ReturnType<ReportsService['dashboard']> {
    return this.reportsService.dashboard(orgId, user.id);
  }

  @Get('profit-per-order')
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  async profitPerOrder(
    @OrgId() orgId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): ReturnType<ReportsService['profitPerOrder']> {
    return this.reportsService.profitPerOrder(orgId, new Date(from), new Date(to));
  }

  @Get('cash-flow')
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  async cashFlow(
    @OrgId() orgId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): ReturnType<ReportsService['cashFlow']> {
    return this.reportsService.cashFlow(orgId, new Date(from), new Date(to));
  }
}
