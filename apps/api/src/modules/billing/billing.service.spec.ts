import { createHmac } from 'node:crypto';

import { BillingService } from './billing.service';

/**
 * Test the webhook signature verifier — the most safety-critical bit of the
 * billing module. Anything else needs Razorpay or Postgres.
 */

describe('BillingService.handleWebhook', () => {
  const ORIG_SECRET = process.env.RZP_WEBHOOK_SECRET;

  beforeEach(() => {
    process.env.RZP_WEBHOOK_SECRET = 'test-secret';
  });
  afterAll(() => {
    if (ORIG_SECRET === undefined) delete process.env.RZP_WEBHOOK_SECRET;
    else process.env.RZP_WEBHOOK_SECRET = ORIG_SECRET;
  });

  const stubPrisma = {
    client: {
      subscription: { findUnique: jest.fn().mockResolvedValue(null) },
      subscriptionPayment: { create: jest.fn() },
    },
  };

  const svc = new BillingService(stubPrisma as never);

  it('rejects requests with a wrong signature', async () => {
    const body = JSON.stringify({ event: 'payment.failed', payload: {} });
    await expect(svc.handleWebhook(body, 'wrong')).rejects.toThrow(/invalid signature/i);
  });

  it('rejects requests with no signature', async () => {
    const body = JSON.stringify({ event: 'payment.failed', payload: {} });
    await expect(svc.handleWebhook(body, '')).rejects.toThrow(/invalid signature/i);
  });

  it('accepts requests signed with the matching secret', async () => {
    const body = JSON.stringify({ event: 'subscription.activated', payload: { subscription: { entity: { id: 'sub_x' } } } });
    const sig = createHmac('sha256', 'test-secret').update(body).digest('hex');
    const out = await svc.handleWebhook(body, sig);
    expect(out).toEqual({ ok: true });
  });
});
