import { createHmac, timingSafeEqual } from 'node:crypto';

import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

import { getPlan, PLANS, type PlanDescriptor } from './plans';

interface RzpClient {
  createCustomer(args: { name: string; email?: string; contact?: string; notes?: Record<string, string> }): Promise<{ id: string }>;
  createSubscription(args: { plan_id: string; customer_id: string; total_count: number; notes?: Record<string, string> }): Promise<{ id: string; status: string; current_end?: number }>;
  cancelSubscription(id: string, cancel_at_cycle_end: boolean): Promise<{ id: string; status: string }>;
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly keyId = process.env.RZP_KEY_ID ?? '';
  private readonly keySecret = process.env.RZP_KEY_SECRET ?? '';
  private readonly webhookSecret = process.env.RZP_WEBHOOK_SECRET ?? '';

  constructor(private readonly prisma: PrismaService) {}

  listPlans(): PlanDescriptor[] {
    return PLANS;
  }

  async getMy(orgId: string): Promise<{
    plan: string;
    status: string;
    trialEndsAt: Date | null;
    currentPeriodEnd: Date | null;
    rzpSubscriptionId: string | null;
  }> {
    const sub = await this.prisma.client.subscription.findUnique({ where: { orgId } });
    const org = await this.prisma.client.organisation.findUnique({ where: { id: orgId } });
    if (!sub) {
      return {
        plan: org?.plan ?? 'FREE',
        status: 'TRIALING',
        trialEndsAt: null,
        currentPeriodEnd: null,
        rzpSubscriptionId: null,
      };
    }
    return {
      plan: sub.plan,
      status: sub.status,
      trialEndsAt: sub.trialEndsAt,
      currentPeriodEnd: sub.currentPeriodEnd,
      rzpSubscriptionId: sub.rzpSubscriptionId,
    };
  }

  /**
   * Begin a checkout. Returns a Razorpay subscription id the web client passes
   * to Razorpay Checkout. In dev mode (no keys) we simulate by activating the
   * plan immediately so flows can be tested end-to-end.
   */
  async startCheckout(orgId: string, planId: string, customer: { name: string; email?: string; contact?: string }): Promise<{
    subscriptionId: string;
    keyId: string | null;
    devSimulated?: boolean;
  }> {
    const plan = getPlan(planId);
    if (!plan) throw new BadRequestException(`Unknown plan: ${planId}`);
    if (plan.id === 'FREE') throw new BadRequestException('Free plan does not require checkout');
    if (plan.requiresSales) throw new BadRequestException('Contact sales to enable this plan');

    if (!this.keyId || !this.keySecret) {
      this.logger.warn(`[DEV] Razorpay keys not set — simulating activation of ${plan.id} for org ${orgId}`);
      await this.upsertSub(orgId, plan, { rzpCustomerId: null, rzpSubscriptionId: null, status: 'ACTIVE' });
      await this.prisma.client.organisation.update({ where: { id: orgId }, data: { plan: plan.id as never } });
      return { subscriptionId: 'dev-simulated', keyId: null, devSimulated: true };
    }

    const planEnv = plan.rzpPlanIdEnv ? process.env[plan.rzpPlanIdEnv] : null;
    if (!planEnv) {
      throw new BadRequestException(`${plan.rzpPlanIdEnv} env var is not configured. Create the plan in Razorpay and set it.`);
    }

    const rzp = this.client();
    const cust = await rzp.createCustomer({ name: customer.name, email: customer.email, contact: customer.contact, notes: { orgId } });
    const sub = await rzp.createSubscription({
      plan_id: planEnv,
      customer_id: cust.id,
      total_count: 12, // 12 billing cycles before mandate must be re-confirmed
      notes: { orgId },
    });

    await this.upsertSub(orgId, plan, {
      rzpCustomerId: cust.id,
      rzpSubscriptionId: sub.id,
      status: sub.status === 'active' ? 'ACTIVE' : 'TRIALING',
    });

    return { subscriptionId: sub.id, keyId: this.keyId };
  }

  async cancel(orgId: string, atCycleEnd = true): Promise<{ ok: true }> {
    const sub = await this.prisma.client.subscription.findUnique({ where: { orgId } });
    if (!sub) throw new NotFoundException('No active subscription');

    if (sub.rzpSubscriptionId && this.keyId) {
      try {
        await this.client().cancelSubscription(sub.rzpSubscriptionId, atCycleEnd);
      } catch (err) {
        this.logger.error(`Razorpay cancel failed: ${err instanceof Error ? err.message : String(err)}`);
        throw new BadRequestException('Could not cancel with Razorpay — please try again');
      }
    }

    await this.prisma.client.subscription.update({
      where: { id: sub.id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
    return { ok: true };
  }

  /**
   * Razorpay webhook handler. Verifies HMAC, then mutates Subscription /
   * Organisation rows based on the event type.
   */
  async handleWebhook(rawBody: string, signature: string): Promise<{ ok: true }> {
    if (!this.webhookSecret) {
      this.logger.warn('RZP_WEBHOOK_SECRET not set — rejecting webhook');
      throw new UnauthorizedException('Webhook secret not configured');
    }
    const expected = createHmac('sha256', this.webhookSecret).update(rawBody).digest('hex');
    if (!signature || expected.length !== signature.length ||
        !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
      throw new UnauthorizedException('Invalid signature');
    }

    let body: { event: string; payload: Record<string, unknown> };
    try {
      body = JSON.parse(rawBody);
    } catch {
      throw new BadRequestException('Webhook body is not JSON');
    }

    this.logger.log(`Razorpay webhook: ${body.event}`);
    const subPayload = (body.payload as { subscription?: { entity: Record<string, unknown> } }).subscription?.entity;
    const paymentPayload = (body.payload as { payment?: { entity: Record<string, unknown> } }).payment?.entity;

    switch (body.event) {
      case 'subscription.activated':
      case 'subscription.charged':
        if (subPayload) {
          await this.markSubscription(subPayload.id as string, 'ACTIVE', subPayload.current_end as number | undefined);
        }
        if (paymentPayload) await this.recordPayment(paymentPayload, 'captured');
        break;
      case 'subscription.halted':
      case 'subscription.pending':
        if (subPayload) await this.markSubscription(subPayload.id as string, 'PAST_DUE');
        break;
      case 'subscription.cancelled':
      case 'subscription.completed':
        if (subPayload) await this.markSubscription(subPayload.id as string, 'CANCELLED');
        break;
      case 'payment.failed':
        if (paymentPayload) await this.recordPayment(paymentPayload, 'failed');
        break;
      default:
        // Don't fail the webhook for events we don't handle yet.
        this.logger.debug(`Unhandled event: ${body.event}`);
    }

    return { ok: true };
  }

  // ---------- helpers ----------

  private async upsertSub(
    orgId: string,
    plan: PlanDescriptor,
    extra: { rzpCustomerId: string | null; rzpSubscriptionId: string | null; status: string },
  ): Promise<void> {
    const data = {
      plan: plan.id as never,
      status: extra.status as never,
      rzpCustomerId: extra.rzpCustomerId,
      rzpSubscriptionId: extra.rzpSubscriptionId,
      rzpPlanId: plan.rzpPlanIdEnv ? process.env[plan.rzpPlanIdEnv] ?? null : null,
      amountPaise: BigInt(plan.monthlyPaise),
      intervalMonths: 1,
    };
    await this.prisma.client.subscription.upsert({
      where: { orgId },
      update: data,
      create: { orgId, ...data },
    });
  }

  private async markSubscription(rzpId: string, status: string, currentEndUnix?: number): Promise<void> {
    const sub = await this.prisma.client.subscription.findUnique({ where: { rzpSubscriptionId: rzpId } });
    if (!sub) {
      this.logger.warn(`Webhook for unknown subscription ${rzpId} — ignoring`);
      return;
    }
    await this.prisma.client.subscription.update({
      where: { id: sub.id },
      data: {
        status: status as never,
        ...(currentEndUnix ? { currentPeriodEnd: new Date(currentEndUnix * 1000) } : {}),
      },
    });
  }

  private async recordPayment(payload: Record<string, unknown>, status: string): Promise<void> {
    const subId = payload.subscription_id as string | undefined;
    if (!subId) return;
    const sub = await this.prisma.client.subscription.findUnique({ where: { rzpSubscriptionId: subId } });
    if (!sub) return;
    await this.prisma.client.subscriptionPayment.create({
      data: {
        subscriptionId: sub.id,
        rzpPaymentId: (payload.id as string) ?? null,
        rzpInvoiceId: (payload.invoice_id as string) ?? null,
        amountPaise: BigInt((payload.amount as number) ?? 0),
        status,
        paidAt: status === 'captured' ? new Date() : null,
        failureReason: status === 'failed' ? ((payload.error_description as string) ?? null) : null,
        rawPayload: payload as never,
      },
    });
  }

  private client(): RzpClient {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const base = 'https://api.razorpay.com/v1';
    const headers = { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' };
    const post = async <T>(url: string, body: unknown): Promise<T> => {
      const res = await fetch(`${base}${url}`, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`Razorpay ${url} failed: ${res.status} ${await res.text()}`);
      return res.json() as Promise<T>;
    };
    return {
      createCustomer: (args) => post('/customers', args),
      createSubscription: (args) => post('/subscriptions', args),
      cancelSubscription: (id, cancel_at_cycle_end) =>
        post(`/subscriptions/${id}/cancel`, { cancel_at_cycle_end: cancel_at_cycle_end ? 1 : 0 }),
    };
  }
}
