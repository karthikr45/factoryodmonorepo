import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

/**
 * Customer-facing read endpoints. No login: customers identify themselves by
 * order number + the phone they placed the order with. The match is exact and
 * the response is intentionally minimal — just enough for them to see "where's
 * my order" and download the invoice.
 */
@Injectable()
export class CustomerPortalService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Look up an order by `orderNumber` and verify the supplied phone matches the
   * customer on the order. Returns the order's lifecycle (status, key dates,
   * dispatched-on, invoice info) — never the full customer record or financial
   * journal.
   */
  async lookup(orderNumber: string, phone: string): Promise<{
    order: {
      number: string;
      productName: string;
      quantity: number;
      unit: string;
      status: string;
      placedOn: Date;
      deliveryDate: Date;
      totalRupees: number;
      paidRupees: number;
      orgName: string;
    };
    dispatch: { dispatchedOn: Date | null; vehicleNumber: string | null; transporter: string | null };
    invoice: { number: string; date: Date; pdfUrl: string; totalRupees: number; paidRupees: number; status: string } | null;
    quotation: { number: string; pdfUrl: string } | null;
  }> {
    const normalised = this.normalisePhone(phone);
    if (!normalised) throw new BadRequestException('Phone must be a valid 10-digit Indian mobile number');

    const order = await this.prisma.client.order.findFirst({
      where: { orderNumber },
      include: {
        customer: { select: { phone: true } },
        organisation: { select: { name: true } },
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.customer.phone !== normalised) {
      // Generic message — don't reveal whether the order number exists for a
      // different phone. Defends against scraping order details by trying random
      // numbers.
      throw new NotFoundException('Order not found');
    }

    // Optional dispatch + invoice lookups; tolerate missing rows.
    const dispatch = await this.prisma.client.dispatch.findFirst({
      where: { orderId: order.id },
      include: { transporter: { select: { name: true } } },
      orderBy: { dispatchDate: 'desc' },
    }).catch(() => null);

    const invoice = await this.prisma.client.invoice.findFirst({
      where: { orderId: order.id },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null);

    const quotation = await this.prisma.client.quotation.findFirst({
      where: { convertedOrderId: order.id },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null);

    return {
      order: {
        number: order.orderNumber,
        productName: order.productName,
        quantity: order.quantity,
        unit: order.unit,
        status: order.status,
        placedOn: order.createdAt,
        deliveryDate: order.deliveryDate,
        totalRupees: Number(order.totalValue) / 100,
        paidRupees: Number(order.advancePaid) / 100,
        orgName: order.organisation.name,
      },
      dispatch: {
        dispatchedOn: dispatch?.dispatchDate ?? null,
        vehicleNumber: dispatch?.vehicleNumber ?? null,
        transporter: dispatch?.transporter?.name ?? null,
      },
      invoice: invoice
        ? {
            number: invoice.invoiceNumber,
            date: invoice.invoiceDate,
            pdfUrl: `/api/customer-portal/invoice/${invoice.id}/pdf?phone=${encodeURIComponent(normalised)}`,
            totalRupees: Number(invoice.totalAmount) / 100,
            paidRupees: Number(invoice.paidAmount) / 100,
            status: invoice.status,
          }
        : null,
      quotation: quotation
        ? {
            number: quotation.quotationNumber,
            pdfUrl: `/api/customer-portal/quotation/${quotation.id}/pdf?phone=${encodeURIComponent(normalised)}`,
          }
        : null,
    };
  }

  /**
   * Verify that the supplied phone matches the customer on the invoice's
   * underlying order. Returns the Invoice id so the caller can stream the
   * usual PDF endpoint without leaking it through a public route.
   */
  async assertCanReadInvoice(invoiceId: string, phone: string): Promise<string> {
    const normalised = this.normalisePhone(phone);
    if (!normalised) throw new BadRequestException('Invalid phone');
    const inv = await this.prisma.client.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: { select: { phone: true } } },
    });
    if (!inv) throw new NotFoundException('Invoice not found');
    if (inv.customer.phone !== normalised) throw new NotFoundException('Invoice not found');
    return inv.id;
  }

  async assertCanReadQuotation(quotationId: string, phone: string): Promise<string> {
    const normalised = this.normalisePhone(phone);
    if (!normalised) throw new BadRequestException('Invalid phone');
    const q = await this.prisma.client.quotation.findUnique({
      where: { id: quotationId },
      include: { customer: { select: { phone: true } } },
    });
    if (!q) throw new NotFoundException('Quotation not found');
    if (q.customer.phone !== normalised) throw new NotFoundException('Quotation not found');
    return q.id;
  }

  private normalisePhone(raw: string): string | null {
    const digits = (raw ?? '').replace(/\D/g, '');
    if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
    if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    if (raw?.startsWith('+91') && /^\+91[6-9]\d{9}$/.test(raw)) return raw;
    return null;
  }
}
