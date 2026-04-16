import { Body, Controller, Get, Headers, HttpCode, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { OrgId } from '../../common/decorators/org-id.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';

import { BillingService } from './billing.service';

@ApiBearerAuth()
@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'Public plan catalogue (used by marketing site + signed-in checkout)' })
  listPlans(): ReturnType<BillingService['listPlans']> {
    return this.billing.listPlans();
  }

  @Get('me')
  async getMine(@OrgId() orgId: string): ReturnType<BillingService['getMy']> {
    return this.billing.getMy(orgId);
  }

  @Post('checkout')
  @RequirePermissions('settings.manage')
  @ApiOperation({ summary: 'Begin Razorpay subscription checkout for the current org' })
  async checkout(
    @OrgId() orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { planId: string; email?: string },
  ): ReturnType<BillingService['startCheckout']> {
    return this.billing.startCheckout(orgId, body.planId, {
      name: user.name,
      email: body.email,
      contact: user.phone,
    });
  }

  @Post('cancel')
  @RequirePermissions('settings.manage')
  async cancel(@OrgId() orgId: string): ReturnType<BillingService['cancel']> {
    return this.billing.cancel(orgId, true);
  }

  /**
   * Razorpay calls this from their servers — no auth header, but we verify
   * the HMAC signature before doing anything destructive.
   */
  @Public()
  @Post('webhook')
  @HttpCode(200)
  async webhook(
    @Req() req: Request,
    @Headers('x-razorpay-signature') signature: string,
  ): ReturnType<BillingService['handleWebhook']> {
    // express.json() has already consumed the body; we re-stringify because
    // Razorpay signs the EXACT bytes they sent. For production deployments,
    // wire a `rawBody` middleware on this route specifically.
    const raw = (req as Request & { rawBody?: Buffer }).rawBody?.toString('utf8')
      ?? JSON.stringify(req.body ?? {});
    return this.billing.handleWebhook(raw, signature);
  }
}
