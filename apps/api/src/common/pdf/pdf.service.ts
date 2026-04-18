import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

/**
 * Server-side PDF generator for invoices, quotations and salary slips.
 * Uses pdfkit (no Chromium dependency) so it ships in the API container as-is.
 *
 * All amounts come in as paise (BigInt). Helpers convert to ₹ for display.
 */

export interface InvoicePdfInput {
  org: { name: string; gstin?: string | null; address?: string | null };
  invoice: {
    number: string;
    date: Date;
    dueDate?: Date | null;
    notes?: string | null;
  };
  customer: { name: string; gstin?: string | null; address?: string | null; phone?: string | null };
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPricePaise: number;
    gstRate: number;
    hsnCode?: string | null;
  }>;
  summary: {
    netPaise: number;
    gstPaise: number;
    totalPaise: number;
    paidPaise?: number;
  };
}

export interface QuotationPdfInput extends Omit<InvoicePdfInput, 'invoice'> {
  quotation: {
    number: string;
    date: Date;
    validUntil?: Date | null;
    notes?: string | null;
  };
}

export interface SalarySlipPdfInput {
  org: { name: string; address?: string | null };
  employee: {
    name: string;
    designation?: string | null;
    department?: string | null;
    panNumber?: string | null;
    bankAccount?: string | null;
    ifscCode?: string | null;
  };
  period: { month: number; year: number }; // 1..12
  earnings: {
    basicPaise: number;
    hraPaise?: number;
    overtimePaise?: number;
    bonusPaise?: number;
    otherPaise?: number;
  };
  deductions: {
    pfPaise?: number;
    esiPaise?: number;
    taxPaise?: number;
    advancePaise?: number;
    otherPaise?: number;
  };
  attendance?: {
    workedDays: number;
    presentDays: number;
    paidLeave: number;
  };
}

@Injectable()
export class PdfService {
  buildInvoice(input: InvoicePdfInput): Promise<Buffer> {
    return this.render((doc) => {
      this.header(doc, input.org, 'TAX INVOICE');
      doc.moveDown(0.5);
      // Invoice meta
      const startY = doc.y;
      doc.fontSize(10).fillColor('#374151')
        .text(`Invoice #: ${input.invoice.number}`, 50, startY)
        .text(`Date: ${this.fmtDate(input.invoice.date)}`, 50, startY + 14);
      if (input.invoice.dueDate) {
        doc.text(`Due: ${this.fmtDate(input.invoice.dueDate)}`, 50, startY + 28);
      }
      doc.moveDown(2);

      // Bill-to
      this.partyBlock(doc, 'Bill To', input.customer);

      doc.moveDown(0.5);
      this.itemsTable(doc, input.items);

      doc.moveDown(0.5);
      this.totals(doc, input.summary);

      if (input.invoice.notes) {
        doc.moveDown(1).fontSize(9).fillColor('#6b7280').text(`Notes: ${input.invoice.notes}`);
      }
      this.footer(doc, 'This is a computer-generated invoice.');
    });
  }

  buildQuotation(input: QuotationPdfInput): Promise<Buffer> {
    return this.render((doc) => {
      this.header(doc, input.org, 'QUOTATION');
      doc.moveDown(0.5);
      const startY = doc.y;
      doc.fontSize(10).fillColor('#374151')
        .text(`Quote #: ${input.quotation.number}`, 50, startY)
        .text(`Date: ${this.fmtDate(input.quotation.date)}`, 50, startY + 14);
      if (input.quotation.validUntil) {
        doc.text(`Valid till: ${this.fmtDate(input.quotation.validUntil)}`, 50, startY + 28);
      }
      doc.moveDown(2);
      this.partyBlock(doc, 'Quoted To', input.customer);
      doc.moveDown(0.5);
      this.itemsTable(doc, input.items);
      doc.moveDown(0.5);
      this.totals(doc, input.summary);
      if (input.quotation.notes) {
        doc.moveDown(1).fontSize(9).fillColor('#6b7280').text(`Notes: ${input.quotation.notes}`);
      }
      this.footer(doc, 'Subject to terms agreed at the time of order confirmation.');
    });
  }

  buildSalarySlip(input: SalarySlipPdfInput): Promise<Buffer> {
    return this.render((doc) => {
      this.header(doc, input.org, 'SALARY SLIP');
      const monthName = new Date(input.period.year, input.period.month - 1, 1)
        .toLocaleString('en-IN', { month: 'long', year: 'numeric' });
      doc.moveDown(0.5);
      doc.fontSize(11).fillColor('#562F54').text(`Pay period: ${monthName}`);
      doc.moveDown(0.5);

      // Employee block
      doc.fontSize(10).fillColor('#111827')
        .text(input.employee.name, { continued: false });
      if (input.employee.designation) doc.fillColor('#6b7280').fontSize(9).text(input.employee.designation);
      if (input.employee.department) doc.fillColor('#6b7280').fontSize(9).text(`Department: ${input.employee.department}`);
      if (input.employee.panNumber) doc.fillColor('#6b7280').fontSize(9).text(`PAN: ${input.employee.panNumber}`);
      if (input.employee.bankAccount) {
        doc.fillColor('#6b7280').fontSize(9)
          .text(`Bank: ${input.employee.bankAccount}${input.employee.ifscCode ? ` (${input.employee.ifscCode})` : ''}`);
      }
      doc.moveDown(0.8);

      if (input.attendance) {
        doc.fontSize(9).fillColor('#374151')
          .text(`Worked days: ${input.attendance.workedDays}   Present: ${input.attendance.presentDays}   Paid leave: ${input.attendance.paidLeave}`);
        doc.moveDown(0.5);
      }

      // Earnings / Deductions table
      const earnings: Array<[string, number]> = [
        ['Basic', input.earnings.basicPaise],
        ['HRA', input.earnings.hraPaise ?? 0],
        ['Overtime', input.earnings.overtimePaise ?? 0],
        ['Bonus', input.earnings.bonusPaise ?? 0],
        ['Other', input.earnings.otherPaise ?? 0],
      ].filter(([, v]) => Number(v) > 0) as Array<[string, number]>;
      const deductions: Array<[string, number]> = [
        ['PF', input.deductions.pfPaise ?? 0],
        ['ESI', input.deductions.esiPaise ?? 0],
        ['TDS', input.deductions.taxPaise ?? 0],
        ['Advance', input.deductions.advancePaise ?? 0],
        ['Other', input.deductions.otherPaise ?? 0],
      ].filter(([, v]) => Number(v) > 0) as Array<[string, number]>;

      const earnTotal = earnings.reduce((s, [, v]) => s + v, 0);
      const dedTotal = deductions.reduce((s, [, v]) => s + v, 0);

      const colW = 250;
      const xL = 50;
      const xR = xL + colW + 10;
      const startY = doc.y;

      doc.fontSize(10).fillColor('#562F54').text('Earnings', xL, startY);
      doc.text('Deductions', xR, startY);
      doc.moveTo(xL, startY + 14).lineTo(xL + colW, startY + 14).strokeColor('#e5e7eb').stroke();
      doc.moveTo(xR, startY + 14).lineTo(xR + colW, startY + 14).stroke();

      let yL = startY + 18;
      let yR = startY + 18;
      doc.fontSize(9).fillColor('#111827');
      for (const [k, v] of earnings) {
        doc.text(k, xL, yL).text(this.rupees(v), xL + colW - 80, yL, { width: 80, align: 'right' });
        yL += 14;
      }
      for (const [k, v] of deductions) {
        doc.text(k, xR, yR).text(this.rupees(v), xR + colW - 80, yR, { width: 80, align: 'right' });
        yR += 14;
      }
      const maxY = Math.max(yL, yR);
      doc.moveTo(xL, maxY + 2).lineTo(xL + colW, maxY + 2).stroke();
      doc.moveTo(xR, maxY + 2).lineTo(xR + colW, maxY + 2).stroke();
      doc.fontSize(10).fillColor('#562F54')
        .text('Total earnings', xL, maxY + 6)
        .text(this.rupees(earnTotal), xL + colW - 80, maxY + 6, { width: 80, align: 'right' })
        .text('Total deductions', xR, maxY + 6)
        .text(this.rupees(dedTotal), xR + colW - 80, maxY + 6, { width: 80, align: 'right' });

      const netY = maxY + 32;
      doc.fontSize(13).fillColor('#562F54')
        .text(`Net pay: ${this.rupees(earnTotal - dedTotal)}`, 50, netY, { align: 'right', width: 500 });

      this.footer(doc, 'Computer-generated salary slip. No signature required.');
    });
  }

  // ---------- Internals ----------

  private render(draw: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c) => chunks.push(c as Buffer));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      try {
        draw(doc);
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private header(doc: PDFKit.PDFDocument, org: { name: string; gstin?: string | null; address?: string | null }, title: string): void {
    doc.fontSize(16).fillColor('#562F54').text(org.name, 50, 50);
    if (org.address) doc.fontSize(9).fillColor('#6b7280').text(org.address);
    if (org.gstin) doc.fontSize(9).fillColor('#6b7280').text(`GSTIN: ${org.gstin}`);
    doc.fontSize(18).fillColor('#562F54').text(title, 50, 50, { align: 'right' });
    doc.moveTo(50, 100).lineTo(545, 100).strokeColor('#562F54').stroke();
  }

  private partyBlock(doc: PDFKit.PDFDocument, label: string, p: { name: string; gstin?: string | null; address?: string | null; phone?: string | null }): void {
    doc.fontSize(9).fillColor('#6b7280').text(label);
    doc.fontSize(11).fillColor('#111827').text(p.name);
    if (p.address) doc.fontSize(9).fillColor('#374151').text(p.address);
    if (p.phone) doc.fontSize(9).fillColor('#374151').text(`Phone: ${p.phone}`);
    if (p.gstin) doc.fontSize(9).fillColor('#374151').text(`GSTIN: ${p.gstin}`);
  }

  private itemsTable(doc: PDFKit.PDFDocument, items: InvoicePdfInput['items']): void {
    const startY = doc.y + 8;
    const cols = { desc: 50, hsn: 280, qty: 340, rate: 400, gst: 460, amt: 500 };
    doc.fontSize(9).fillColor('#562F54')
      .text('Description', cols.desc, startY)
      .text('HSN', cols.hsn, startY)
      .text('Qty', cols.qty, startY, { width: 50, align: 'right' })
      .text('Rate', cols.rate, startY, { width: 50, align: 'right' })
      .text('GST%', cols.gst, startY, { width: 35, align: 'right' })
      .text('Amount', cols.amt, startY, { width: 45, align: 'right' });
    doc.moveTo(50, startY + 14).lineTo(545, startY + 14).strokeColor('#e5e7eb').stroke();

    let y = startY + 20;
    doc.fontSize(9).fillColor('#111827');
    for (const it of items) {
      const lineNet = it.unitPricePaise * it.quantity;
      doc.text(it.description, cols.desc, y, { width: 220 })
        .text(it.hsnCode ?? '-', cols.hsn, y)
        .text(`${it.quantity} ${it.unit}`, cols.qty, y, { width: 50, align: 'right' })
        .text(this.rupees(it.unitPricePaise), cols.rate, y, { width: 50, align: 'right' })
        .text(`${it.gstRate}%`, cols.gst, y, { width: 35, align: 'right' })
        .text(this.rupees(lineNet), cols.amt, y, { width: 45, align: 'right' });
      y += 18;
    }
    doc.moveTo(50, y).lineTo(545, y).strokeColor('#e5e7eb').stroke();
    doc.y = y + 4;
  }

  private totals(doc: PDFKit.PDFDocument, s: InvoicePdfInput['summary']): void {
    const xLabel = 380;
    const xVal = 470;
    const y = doc.y + 8;
    doc.fontSize(10).fillColor('#374151')
      .text('Subtotal', xLabel, y).text(this.rupees(s.netPaise), xVal, y, { width: 75, align: 'right' });
    doc.text('GST', xLabel, y + 14).text(this.rupees(s.gstPaise), xVal, y + 14, { width: 75, align: 'right' });
    doc.fontSize(12).fillColor('#562F54')
      .text('Total', xLabel, y + 32).text(this.rupees(s.totalPaise), xVal, y + 32, { width: 75, align: 'right' });
    if (s.paidPaise && s.paidPaise > 0) {
      doc.fontSize(10).fillColor('#10b981')
        .text(`Paid: ${this.rupees(s.paidPaise)}`, xLabel, y + 50, { width: 145, align: 'right' });
      doc.fontSize(10).fillColor('#dc2626')
        .text(`Balance due: ${this.rupees(s.totalPaise - s.paidPaise)}`, xLabel, y + 64, { width: 145, align: 'right' });
    }
  }

  private footer(doc: PDFKit.PDFDocument, line: string): void {
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc.fontSize(8).fillColor('#9ca3af')
        .text(line, 50, 800, { align: 'center', width: 495 });
    }
  }

  private rupees(paise: number): string {
    const r = paise / 100;
    return `₹${r.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private fmtDate(d: Date): string {
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
