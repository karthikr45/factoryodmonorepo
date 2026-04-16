/**
 * Sentry initialisation. Safe no-op when SENTRY_DSN is not set, so dev and CI
 * runs don't accidentally pipe noise to a real project.
 *
 * The Nest exception filter (HttpExceptionFilter) calls captureException() so
 * any 5xx that escapes our handlers shows up in Sentry; lower-priority warnings
 * can call captureMessage() directly.
 */

import { Logger } from '@nestjs/common';

// Sentry imported lazily so missing peer-dep doesn't crash boot during tests.
type SentryNS = typeof import('@sentry/node');
let sentry: SentryNS | null = null;
let initialised = false;

const log = new Logger('Sentry');

export async function initSentry(): Promise<void> {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    log.log('SENTRY_DSN not set — error tracking disabled');
    return;
  }
  try {
    sentry = await import('@sentry/node');
    sentry.init({
      dsn,
      environment: process.env.NODE_ENV ?? 'development',
      release: process.env.SENTRY_RELEASE,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
      // We strip request bodies so we don't accidentally leak phone/OTP/PII.
      beforeSend(event) {
        if (event.request) {
          delete event.request.data;
          delete event.request.cookies;
        }
        return event;
      },
    });
    initialised = true;
    log.log(`Sentry initialised (env=${process.env.NODE_ENV ?? 'development'})`);
  } catch (err) {
    log.warn(`Failed to initialise Sentry: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function captureException(err: unknown, ctx?: Record<string, unknown>): void {
  if (!initialised || !sentry) return;
  sentry.withScope((scope) => {
    if (ctx) Object.entries(ctx).forEach(([k, v]) => scope.setExtra(k, v));
    sentry!.captureException(err);
  });
}

export function captureMessage(msg: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (!initialised || !sentry) return;
  sentry.captureMessage(msg, level);
}
