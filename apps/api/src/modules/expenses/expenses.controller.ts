import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

import { ExpensesService, type CreateExpenseInput } from './expenses.service';

@ApiBearerAuth()
@ApiTags('expenses')
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expenses: ExpensesService) {}

  @Get()
  @RequirePermissions('finance.view')
  async list(
    @OrgId() orgId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): ReturnType<ExpensesService['list']> {
    return this.expenses.list(orgId, from ? new Date(from) : undefined, to ? new Date(to) : undefined);
  }

  @Post()
  @RequirePermissions('finance.create')
  async create(
    @OrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateExpenseInput,
  ): ReturnType<ExpensesService['create']> {
    return this.expenses.create(orgId, user.id, body);
  }
}
