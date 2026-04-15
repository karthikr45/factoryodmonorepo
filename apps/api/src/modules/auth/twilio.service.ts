import { Injectable, Logger } from '@nestjs/common';

/**
 * Twilio SMS sender.
 *
 * In development (no Twilio creds): logs the OTP to stdout so devs can copy it.
 * In production: calls Twilio's REST API via fetch — no SDK dep needed.
 */
@Injectable()
export class TwilioService {
  private readonly logger = new Logger(TwilioService.name);
  private readonly accountSid = process.env.TWILIO_ACCOUNT_SID ?? '';
  private readonly authToken = process.env.TWILIO_AUTH_TOKEN ?? '';
  private readonly from = process.env.TWILIO_FROM ?? '';

  async sendOtp(phone: string, code: string): Promise<void> {
    const body = `Your FactoryOS verification code is ${code}. Valid for 10 minutes.`;

    if (!this.accountSid || !this.authToken || !this.from) {
      this.logger.warn(
        `[DEV MODE] SMS to ${phone}: ${body}  (Set TWILIO_* env vars to send real SMS.)`,
      );
      return;
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
    const params = new URLSearchParams({ To: phone, From: this.from, Body: body });

    const maxAttempts = 3;
    let lastError = '';
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });
        if (res.ok) return;
        const text = await res.text();
        lastError = `${res.status} ${text}`;
        // Permanent errors (bad phone number, auth): don't retry
        if (res.status >= 400 && res.status < 500) {
          this.logger.error(`Twilio permanent error: ${lastError}`);
          throw new Error('SMS delivery failed (invalid number or auth)');
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
      }
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
      }
    }

    this.logger.error(`Twilio send failed after ${maxAttempts} attempts: ${lastError}`);
    throw new Error('SMS delivery failed');
  }
}
