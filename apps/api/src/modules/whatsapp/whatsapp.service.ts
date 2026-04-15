import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * WhatsApp Business API integration.
 * Uses Meta Cloud API. In dev mode (no token), logs messages to console.
 */
@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly token = process.env.WHATSAPP_ACCESS_TOKEN ?? '';
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? '';

  constructor(private readonly prisma: PrismaService) {}

  async sendText(orgId: string, phone: string, message: string): Promise<{ id: string }> {
    const record = await this.prisma.client.whatsAppMessage.create({
      data: {
        orgId, phone, content: message, direction: 'OUTBOUND',
        status: 'QUEUED',
      },
    });

    if (!this.token || !this.phoneNumberId) {
      this.logger.warn(`[DEV] WhatsApp to ${phone}: ${message}`);
      await this.prisma.client.whatsAppMessage.update({
        where: { id: record.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
      return { id: record.id };
    }

    await this.postToMeta(record.id, {
      messaging_product: 'whatsapp',
      to: phone.replace('+', ''),
      type: 'text',
      text: { body: message },
    });

    return { id: record.id };
  }

  async sendTemplate(orgId: string, phone: string, templateName: string, params: Record<string, string>): Promise<{ id: string }> {
    const content = `Template: ${templateName} | Params: ${JSON.stringify(params)}`;
    const record = await this.prisma.client.whatsAppMessage.create({
      data: {
        orgId, phone, content, templateName, direction: 'OUTBOUND',
        status: 'QUEUED', metadata: params as never,
      },
    });

    if (!this.token || !this.phoneNumberId) {
      this.logger.warn(`[DEV] WhatsApp template to ${phone}: ${templateName} ${JSON.stringify(params)}`);
      await this.prisma.client.whatsAppMessage.update({
        where: { id: record.id },
        data: { status: 'SENT', sentAt: new Date() },
      });
      return { id: record.id };
    }

    // Meta template send: parameters passed in `components`, positional.
    const components = [
      {
        type: 'body',
        parameters: Object.values(params).map((text) => ({ type: 'text', text })),
      },
    ];
    await this.postToMeta(record.id, {
      messaging_product: 'whatsapp',
      to: phone.replace('+', ''),
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components,
      },
    });

    return { id: record.id };
  }

  /**
   * Send one payload to Meta Cloud API with up to 3 retries on transient
   * failures. Updates the WhatsAppMessage row in the DB with final status.
   */
  private async postToMeta(messageRowId: string, payload: unknown): Promise<void> {
    const url = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
    const maxAttempts = 3;
    let lastError = '';

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = (await res.json()) as { messages?: Array<{ id: string }> };
          const waId = data.messages?.[0]?.id;
          await this.prisma.client.whatsAppMessage.update({
            where: { id: messageRowId },
            data: { status: 'SENT', sentAt: new Date(), waMessageId: waId ?? null },
          });
          return;
        }

        // 4xx = don't retry (permanent error — invalid phone, template not approved etc.)
        const text = await res.text();
        lastError = `${res.status} ${text}`;
        if (res.status >= 400 && res.status < 500) break;
      } catch (err) {
        lastError = String(err);
      }
      // Exponential backoff on retry
      if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
    }

    this.logger.error(`WhatsApp send failed after ${maxAttempts} attempts: ${lastError}`);
    await this.prisma.client.whatsAppMessage.update({
      where: { id: messageRowId },
      data: { status: 'FAILED', metadata: { error: lastError } as never },
    });
  }

  // Convenience methods for common business messages
  async sendOrderConfirmation(orgId: string, phone: string, orderNumber: string): Promise<{ id: string }> {
    return this.sendText(orgId, phone, `Your order ${orderNumber} has been confirmed. We will update you when it's ready for dispatch. — FactoryOS`);
  }

  async sendDispatchNotification(orgId: string, phone: string, orderNumber: string, vehicleNumber?: string): Promise<{ id: string }> {
    const vehicle = vehicleNumber ? ` Vehicle: ${vehicleNumber}.` : '';
    return this.sendText(orgId, phone, `Your order ${orderNumber} has been dispatched.${vehicle} — FactoryOS`);
  }

  async sendSalarySlip(orgId: string, phone: string, workerName: string, month: string, netAmount: string): Promise<{ id: string }> {
    return this.sendText(orgId, phone, `Hi ${workerName}, your salary for ${month} of ${netAmount} has been processed. — FactoryOS`);
  }

  async sendAttendanceReminder(orgId: string, phone: string): Promise<{ id: string }> {
    return this.sendText(orgId, phone, `Reminder: Please mark today's attendance for your deployed workers on FactoryOS.`);
  }

  async listMessages(orgId: string, phone?: string, limit = 50): Promise<Array<{
    id: string; phone: string; content: string; direction: string;
    status: string; sentAt: Date | null; createdAt: Date;
  }>> {
    return this.prisma.client.whatsAppMessage.findMany({
      where: { orgId, ...(phone ? { phone } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
