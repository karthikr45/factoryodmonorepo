import { ApprovalsService } from './approvals.service';

/**
 * The tiny operator matcher in ApprovalsService.matches() is what decides
 * whether a rule fires. A bug here means approvals silently misroute, so
 * lock the table down with explicit cases.
 */

describe('ApprovalsService.matches', () => {
  // Stub deps — none are used by the private matches method.
  const svc = new ApprovalsService({} as never, {} as never, {} as never);
  const matches = (op: string, threshold: number | null, value: number): boolean =>
    (svc as unknown as { matches(o: string, t: number | null, v: number): boolean }).matches(op, threshold, value);

  it.each([
    ['ANY', null, 0, true],
    ['ANY', 100, 0, true],
    ['GT', 100, 200, true],
    ['GT', 100, 100, false],
    ['GTE', 100, 100, true],
    ['GTE', 100, 99, false],
    ['LT', 100, 50, true],
    ['LT', 100, 100, false],
    ['LTE', 100, 100, true],
    ['LTE', 100, 101, false],
    ['EQ', 100, 100, true],
    ['EQ', 100, 99, false],
    ['NEQ', 100, 99, true],
    ['NEQ', 100, 100, false],
    ['GARBAGE', 100, 999, false],
  ] as Array<[string, number | null, number, boolean]>)(
    'matches(%s, %s, %s) → %s',
    (op, threshold, value, expected) => {
      expect(matches(op, threshold, value)).toBe(expected);
    },
  );
});
