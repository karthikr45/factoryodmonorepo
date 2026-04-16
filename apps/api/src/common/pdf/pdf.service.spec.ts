import { PdfService } from './pdf.service';

describe('PdfService', () => {
  const svc = new PdfService();

  it('produces a valid PDF buffer for an invoice', async () => {
    const buf = await svc.buildInvoice({
      org: { name: 'Acme Pvt Ltd', gstin: '36AAACA1234A1Z5', address: 'Hyderabad' },
      invoice: { number: 'INV-1', date: new Date('2026-04-15'), dueDate: new Date('2026-05-15'), notes: 'Pay by NEFT' },
      customer: { name: 'Tata Steel', gstin: '27AAACT2727Q1ZW', address: 'Mumbai', phone: '+919876543210' },
      items: [
        { description: 'Steel rod', quantity: 10, unit: 'pcs', unitPricePaise: 50000, gstRate: 18, hsnCode: '7214' },
      ],
      summary: { netPaise: 500000, gstPaise: 90000, totalPaise: 590000, paidPaise: 100000 },
    });
    expect(buf).toBeInstanceOf(Buffer);
    expect(buf.length).toBeGreaterThan(500);
    // Every PDF starts with %PDF-
    expect(buf.subarray(0, 5).toString('utf8')).toBe('%PDF-');
  });

  it('produces a salary slip even when optional earnings are missing', async () => {
    const buf = await svc.buildSalarySlip({
      org: { name: 'Acme Pvt Ltd' },
      employee: { name: 'Ravi Kumar' },
      period: { month: 4, year: 2026 },
      earnings: { basicPaise: 1_50_000_00 },
      deductions: { pfPaise: 18_000_00 },
    });
    expect(buf.subarray(0, 5).toString('utf8')).toBe('%PDF-');
  });
});
