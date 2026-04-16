import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UsePipes,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import {
  createJournalEntrySchema,
  createLedgerSchema,
  type CreateJournalEntryInput,
  type CreateLedgerInput,
} from '@repo/validators';

import {
  CurrentUser,
  type AuthenticatedUser,
} from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { RelationshipsService } from '../relationships/relationships.service';

import { FinanceService } from './finance.service';

@ApiBearerAuth()
@ApiTags('finance')
@Controller('finance')
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly relationships: RelationshipsService,
  ) {}

  // ---- Ledgers ----
  @Get('ledgers')
  async listLedgers(
    @OrgId() orgId: string,
  ): ReturnType<FinanceService['listLedgers']> {
    return this.financeService.listLedgers(orgId);
  }

  @Post('ledgers')
  @UsePipes(new ZodValidationPipe(createLedgerSchema))
  async createLedger(
    @OrgId() orgId: string,
    @Body() body: CreateLedgerInput,
  ): ReturnType<FinanceService['createLedger']> {
    return this.financeService.createLedger(orgId, body);
  }

  // ---- Journal ----
  @Get('journal')
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'ledgerCode', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  async listJournal(
    @OrgId() orgId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('ledgerCode') ledgerCode?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): ReturnType<FinanceService['listJournal']> {
    return this.financeService.listJournal(orgId, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      ledgerCode,
      page: Number(page ?? 1),
      pageSize: Math.min(Number(pageSize ?? 50), 200),
    });
  }

  @Post('journal')
  @ApiOperation({ summary: 'Manually post a journal entry' })
  @UsePipes(new ZodValidationPipe(createJournalEntrySchema))
  async createJournal(
    @OrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: CreateJournalEntryInput,
  ): ReturnType<FinanceService['createJournalEntry']> {
    return this.financeService.createJournalEntry(orgId, user.id, body);
  }

  // ---- Reports ----
  @Get('trial-balance')
  @ApiQuery({ name: 'asOf', required: false })
  async trialBalance(
    @OrgId() orgId: string,
    @Query('asOf') asOf?: string,
  ): ReturnType<FinanceService['trialBalance']> {
    return this.financeService.trialBalance(orgId, asOf ? new Date(asOf) : undefined);
  }

  @Get('profit-and-loss')
  @ApiQuery({ name: 'from', required: true })
  @ApiQuery({ name: 'to', required: true })
  async pnl(
    @OrgId() orgId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): ReturnType<FinanceService['profitAndLoss']> {
    return this.financeService.profitAndLoss(orgId, new Date(from), new Date(to));
  }

  @Get('aged-receivables')
  async agedReceivables(@OrgId() orgId: string): ReturnType<FinanceService['agedReceivables']> {
    return this.financeService.agedReceivables(orgId);
  }

  @Get('aged-payables')
  async agedPayables(@OrgId() orgId: string): ReturnType<FinanceService['agedPayables']> {
    return this.financeService.agedPayables(orgId);
  }

  // ---- CA cross-client reads ----
  // The path includes the client orgId; we verify the caller is a CA with
  // an active FACTORY_CA relationship to that org before delegating.

  @Get('client/:clientOrgId/trial-balance')
  async clientTrialBalance(
    @OrgId() caOrgId: string,
    @Param('clientOrgId') clientOrgId: string,
  ): ReturnType<FinanceService['trialBalance']> {
    await this.relationships.assertCaCanRead(caOrgId, clientOrgId);
    return this.financeService.trialBalance(clientOrgId);
  }

  @Get('client/:clientOrgId/profit-and-loss')
  async clientPnl(
    @OrgId() caOrgId: string,
    @Param('clientOrgId') clientOrgId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): ReturnType<FinanceService['profitAndLoss']> {
    await this.relationships.assertCaCanRead(caOrgId, clientOrgId);
    return this.financeService.profitAndLoss(clientOrgId, new Date(from), new Date(to));
  }
}
