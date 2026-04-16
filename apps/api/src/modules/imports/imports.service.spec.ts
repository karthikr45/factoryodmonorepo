import { ImportsService } from './imports.service';

/**
 * Unit tests for the CSV parser + phone normaliser. No Prisma involved —
 * we only ever exercise the pure logic via private method calls on a stub.
 */

describe('ImportsService', () => {
  // PrismaService is unused for these tests; cast a stub.
  const svc = new ImportsService({} as never);

  describe('parseCsv (via importCustomers header check)', () => {
    it('rejects an empty body', async () => {
      await expect(svc.importCustomers('org', '   ')).rejects.toThrow(/empty/i);
    });

    it('strips a UTF-8 BOM that Excel adds', async () => {
      // Header-only CSV → 0 rows, no error after the header check passes.
      const out = await svc.importCustomers('org', '\uFEFFname,phone\n');
      expect(out.total).toBe(0);
    });

    it('rejects a CSV missing required columns', async () => {
      await expect(svc.importCustomers('org', 'name\nx\n')).rejects.toThrow(/required columns/i);
    });
  });

  describe('phone normalisation', () => {
    const norm = (raw: string): string | null =>
      (svc as unknown as { normalizePhone(s: string): string | null }).normalizePhone(raw);

    it.each([
      ['9876543210', '+919876543210'],
      ['09876543210', '+919876543210'],
      ['919876543210', '+919876543210'],
      ['+91 98765 43210', '+919876543210'],
      ['98 76 54 32 10', '+919876543210'],
    ])('normalises %s → %s', (input, expected) => {
      expect(norm(input)).toBe(expected);
    });

    it.each(['12345', '5876543210', 'abcdef', ''])('rejects invalid %s', (bad) => {
      expect(norm(bad)).toBeNull();
    });
  });

  describe('buildTemplate', () => {
    it('returns a header row plus a sample row for every kind', () => {
      for (const kind of ['customers', 'vendors', 'employees'] as const) {
        const tpl = svc.buildTemplate(kind);
        const lines = tpl.trim().split('\n');
        expect(lines.length).toBe(2);
        expect(lines[0]).toContain('name');
        expect(lines[0]).toContain('phone');
      }
    });
  });
});
