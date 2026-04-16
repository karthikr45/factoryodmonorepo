import { Logger } from '@nestjs/common';

/**
 * Abstraction over a GST Suvidha Provider (GSP) / IRP gateway.
 * Real integrations (Cleartax, IRIS, Masters India, Karur Vysya etc.) all expose
 * roughly the same surface — push a return JSON, push an e-invoice, get an
 * IRN/QR back.
 *
 * The default implementation is a "log only" provider that's used when no
 * provider is configured — it makes the rest of the app act as if filing
 * succeeded so flows can be tested without spending money on a sandbox.
 */

export interface GstReturnPushResult {
  acknowledgmentNumber: string;
  filedAt: Date;
  /** Provider raw payload — stored on GSTReturn for audit. */
  providerPayload: Record<string, unknown>;
}

export interface EInvoiceRequest {
  invoiceNumber: string;
  invoiceDate: Date;
  sellerGstin: string;
  buyerGstin: string | null;
  totalPaise: number;
  gstPaise: number;
  items: Array<{
    description: string;
    hsnCode?: string | null;
    quantity: number;
    unit: string;
    unitPricePaise: number;
    gstRate: number;
  }>;
}

export interface EInvoiceResult {
  irn: string;            // 64-char Invoice Reference Number
  ackNumber: string;
  ackDate: Date;
  qrCode: string;         // base64 PNG (or signed payload, depending on provider)
  signedInvoice?: string; // optional JWT-signed invoice payload
}

export interface GspProvider {
  readonly name: string;
  pushGstr1(gstin: string, period: string, payload: unknown): Promise<GstReturnPushResult>;
  pushGstr3b(gstin: string, period: string, payload: unknown): Promise<GstReturnPushResult>;
  generateEInvoice(req: EInvoiceRequest): Promise<EInvoiceResult>;
}

class NoopProvider implements GspProvider {
  readonly name = 'noop';
  private readonly log = new Logger('NoopGspProvider');

  async pushGstr1(_gstin: string, period: string, payload: unknown): Promise<GstReturnPushResult> {
    this.log.warn(`[DEV] GSTR-1 push for ${period} simulated — set GSP_PROVIDER to wire a real GSP`);
    return { acknowledgmentNumber: `DEV-1-${period}-${Date.now()}`, filedAt: new Date(), providerPayload: { simulated: true, payload } };
  }

  async pushGstr3b(_gstin: string, period: string, payload: unknown): Promise<GstReturnPushResult> {
    this.log.warn(`[DEV] GSTR-3B push for ${period} simulated`);
    return { acknowledgmentNumber: `DEV-3B-${period}-${Date.now()}`, filedAt: new Date(), providerPayload: { simulated: true, payload } };
  }

  async generateEInvoice(req: EInvoiceRequest): Promise<EInvoiceResult> {
    this.log.warn(`[DEV] e-invoice for ${req.invoiceNumber} simulated`);
    // 64-character placeholder IRN so downstream code (PDF embedding, etc.) doesn't choke on length.
    const irn = ('SIMULATED' + req.invoiceNumber + Date.now().toString(36)).padEnd(64, '0').slice(0, 64);
    return {
      irn,
      ackNumber: `DEV-ACK-${Date.now()}`,
      ackDate: new Date(),
      qrCode: 'data:image/png;base64,iVBORw0KGgo=', // 1×1 transparent PNG
    };
  }
}

/**
 * Skeleton for the Cleartax GSP. Stubs the auth + endpoints we'd actually call.
 * Real implementation requires:
 *   - CLEARTAX_CLIENT_ID, CLEARTAX_CLIENT_SECRET (OAuth client creds)
 *   - GSTN portal credentials per org (stored encrypted in Subscription metadata)
 * The methods throw NotImplemented until those are wired.
 */
class CleartaxProvider implements GspProvider {
  readonly name = 'cleartax';

  async pushGstr1(): Promise<GstReturnPushResult> {
    throw new Error('Cleartax provider is a skeleton — implement OAuth + /gstr1/save and /gstr1/file endpoints');
  }
  async pushGstr3b(): Promise<GstReturnPushResult> {
    throw new Error('Cleartax provider is a skeleton — implement /gstr3b/save and /gstr3b/file endpoints');
  }
  async generateEInvoice(): Promise<EInvoiceResult> {
    throw new Error('Cleartax e-invoice provider is a skeleton — implement /einvoice/generate endpoint');
  }
}

let cached: GspProvider | null = null;

export function getGspProvider(): GspProvider {
  if (cached) return cached;
  const choice = (process.env.GSP_PROVIDER ?? 'noop').toLowerCase();
  switch (choice) {
    case 'cleartax':
      cached = new CleartaxProvider();
      break;
    case 'noop':
    default:
      cached = new NoopProvider();
  }
  return cached;
}
