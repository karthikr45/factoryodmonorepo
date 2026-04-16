import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../common/prisma/prisma.service';

export interface ImportResult {
  total: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
}

interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * CSV importer for the three boring-but-essential pilot day-1 imports:
 * customers, vendors, and direct employees.
 *
 * The parser is intentionally tiny — handles quoted cells, embedded commas
 * and escaped quotes, but no obscure dialects. Files come from Excel/Sheets,
 * which both produce well-formed RFC 4180 output.
 */
@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);

  /** Public so the controller can return a sample template for download. */
  static readonly TEMPLATES = {
    customers: ['name', 'phone', 'email', 'gstin', 'address', 'creditLimitRupees'],
    vendors: ['name', 'phone', 'gstin', 'address'],
    employees: ['name', 'phone', 'role', 'designation', 'department', 'monthlySalaryRupees', 'email'],
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  // ---------- public API ----------

  async importCustomers(orgId: string, csv: string): Promise<ImportResult> {
    const parsed = this.parseCsv(csv);
    this.assertHeaders(parsed.headers, ['name', 'phone'], 'customers');
    return this.runImport(parsed, async (row, rowNum) => {
      const phone = this.normalizePhone(row.phone);
      if (!phone) throw new Error(`Row ${rowNum}: invalid phone "${row.phone}"`);
      const data = {
        name: this.requireString(row.name, 'name', rowNum),
        phone,
        email: row.email || null,
        gstin: row.gstin ? row.gstin.toUpperCase() : null,
        address: row.address || null,
        creditLimit: BigInt(Math.round(Number(row.creditLimitRupees ?? 0) * 100)),
      };
      const existing = await this.prisma.client.customer.findFirst({ where: { orgId, phone } });
      if (existing) {
        await this.prisma.client.customer.update({ where: { id: existing.id }, data });
        return 'updated' as const;
      }
      await this.prisma.client.customer.create({ data: { ...data, orgId } });
      return 'inserted' as const;
    });
  }

  async importVendors(orgId: string, csv: string): Promise<ImportResult> {
    const parsed = this.parseCsv(csv);
    this.assertHeaders(parsed.headers, ['name', 'phone'], 'vendors');
    return this.runImport(parsed, async (row, rowNum) => {
      const phone = this.normalizePhone(row.phone);
      if (!phone) throw new Error(`Row ${rowNum}: invalid phone "${row.phone}"`);
      const data = {
        name: this.requireString(row.name, 'name', rowNum),
        phone,
        gstin: row.gstin ? row.gstin.toUpperCase() : null,
        address: row.address || null,
      };
      const existing = await this.prisma.client.vendor.findFirst({ where: { orgId, name: data.name } });
      if (existing) {
        await this.prisma.client.vendor.update({ where: { id: existing.id }, data });
        return 'updated' as const;
      }
      await this.prisma.client.vendor.create({ data: { ...data, orgId } });
      return 'inserted' as const;
    });
  }

  async importEmployees(orgId: string, csv: string): Promise<ImportResult> {
    const parsed = this.parseCsv(csv);
    this.assertHeaders(parsed.headers, ['name', 'phone', 'role'], 'employees');
    return this.runImport(parsed, async (row, rowNum) => {
      const phone = this.normalizePhone(row.phone);
      if (!phone) throw new Error(`Row ${rowNum}: invalid phone "${row.phone}"`);
      const role = (row.role ?? '').toUpperCase();
      if (role !== 'WORKER' && role !== 'MANAGER') {
        throw new Error(`Row ${rowNum}: role must be WORKER or MANAGER (got "${row.role}")`);
      }

      // Resolve / create department by name (optional).
      let departmentId: string | null = null;
      if (row.department) {
        const dept = await this.prisma.client.department.findFirst({
          where: { orgId, name: row.department },
        });
        departmentId = dept ? dept.id : (await this.prisma.client.department.create({
          data: { orgId, name: row.department, sequence: 100, isActive: true },
        })).id;
      }

      const monthlyPaise = BigInt(Math.round(Number(row.monthlySalaryRupees ?? 0) * 100));

      // Phone is unique across the whole platform; if the user already exists in
      // this org we update them, otherwise we create a fresh user + profile.
      const existingUser = await this.prisma.client.user.findUnique({ where: { phone } });
      if (existingUser && existingUser.orgId !== orgId) {
        throw new Error(`Row ${rowNum}: phone ${phone} belongs to a user in another organisation`);
      }
      if (existingUser) {
        await this.prisma.client.user.update({
          where: { id: existingUser.id },
          data: {
            name: this.requireString(row.name, 'name', rowNum),
            email: row.email || existingUser.email,
            role: role as never,
          },
        });
        await this.prisma.client.employeeProfile.upsert({
          where: { userId: existingUser.id },
          update: {
            designation: row.designation || 'Staff',
            departmentId,
            monthlySalary: monthlyPaise,
          },
          create: {
            userId: existingUser.id,
            orgId,
            designation: row.designation || 'Staff',
            departmentId,
            monthlySalary: monthlyPaise,
          },
        });
        return 'updated' as const;
      }

      const user = await this.prisma.client.user.create({
        data: {
          orgId,
          name: this.requireString(row.name, 'name', rowNum),
          phone,
          email: row.email || null,
          role: role as never,
        },
      });
      await this.prisma.client.employeeProfile.create({
        data: {
          userId: user.id,
          orgId,
          designation: row.designation || 'Staff',
          departmentId,
          monthlySalary: monthlyPaise,
        },
      });
      return 'inserted' as const;
    });
  }

  buildTemplate(kind: keyof typeof ImportsService.TEMPLATES): string {
    const headers = ImportsService.TEMPLATES[kind].join(',');
    const sample = this.sampleRow(kind);
    return `${headers}\n${sample}\n`;
  }

  // ---------- internals ----------

  private async runImport(
    parsed: ParsedCsv,
    handler: (row: Record<string, string>, rowNum: number) => Promise<'inserted' | 'updated'>,
  ): Promise<ImportResult> {
    const result: ImportResult = { total: parsed.rows.length, inserted: 0, updated: 0, skipped: 0, errors: [] };
    let rowNum = 1; // header is row 0
    for (const row of parsed.rows) {
      rowNum++;
      try {
        const verdict = await handler(row, rowNum);
        result[verdict]++;
      } catch (err) {
        result.skipped++;
        result.errors.push({ row: rowNum, reason: err instanceof Error ? err.message : String(err) });
        if (result.errors.length > 50) break; // bail out to avoid noisy 500-row failures
      }
    }
    this.logger.log(`Import done: ${JSON.stringify({ total: result.total, inserted: result.inserted, updated: result.updated, skipped: result.skipped })}`);
    return result;
  }

  private parseCsv(text: string): ParsedCsv {
    // Strip a UTF-8 BOM if Excel added one.
    let cleaned = text.replace(/^\uFEFF/, '').trim();
    if (!cleaned) throw new BadRequestException('CSV is empty');

    const allRows: string[][] = [];
    let cur: string[] = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < cleaned.length; i++) {
      const ch = cleaned[i];
      if (inQuotes) {
        if (ch === '"' && cleaned[i + 1] === '"') { cell += '"'; i++; continue; }
        if (ch === '"') { inQuotes = false; continue; }
        cell += ch;
      } else {
        if (ch === '"') { inQuotes = true; continue; }
        if (ch === ',') { cur.push(cell); cell = ''; continue; }
        if (ch === '\n' || ch === '\r') {
          if (ch === '\r' && cleaned[i + 1] === '\n') i++;
          cur.push(cell); cell = '';
          allRows.push(cur); cur = [];
          continue;
        }
        cell += ch;
      }
    }
    if (cell.length > 0 || cur.length > 0) { cur.push(cell); allRows.push(cur); }

    const [headerRow, ...dataRows] = allRows;
    if (!headerRow) throw new BadRequestException('CSV is missing a header row');

    const headers = headerRow.map((h) => h.trim());
    const rows = dataRows
      .filter((r) => r.some((c) => c.trim() !== ''))
      .map((r) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          obj[h] = (r[idx] ?? '').trim();
        });
        return obj;
      });

    return { headers, rows };
  }

  private assertHeaders(headers: string[], required: string[], kind: string): void {
    const missing = required.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      throw new BadRequestException(
        `${kind} CSV is missing required columns: ${missing.join(', ')}. ` +
        `Expected at minimum: ${required.join(', ')}.`,
      );
    }
  }

  private requireString(v: string | undefined, field: string, rowNum: number): string {
    const s = (v ?? '').trim();
    if (!s) throw new Error(`Row ${rowNum}: "${field}" is required`);
    return s;
  }

  /** Same logic the order form uses — accept loose phone formats. */
  private normalizePhone(raw: string | undefined): string | null {
    if (!raw) return null;
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10 && /^[6-9]/.test(digits)) return `+91${digits}`;
    if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    if (raw.startsWith('+91') && /^\+91[6-9]\d{9}$/.test(raw)) return raw;
    return null;
  }

  private sampleRow(kind: keyof typeof ImportsService.TEMPLATES): string {
    switch (kind) {
      case 'customers':
        return 'Tata Steel,9876543210,buyer@tata.com,27AAACT2727Q1ZW,"Mumbai, MH",500000';
      case 'vendors':
        return 'Hyderabad Hardware,9876500000,36AAACH1234A1Z9,"Secunderabad, TS"';
      case 'employees':
        return 'Ravi Kumar,9876511111,WORKER,CNC Operator,Cutting,18000,';
    }
  }
}
