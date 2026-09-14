import {describe, expect, it} from 'vitest';

import {MatchStatus} from '@/enums';

import {isAwaitingResult, splitMatchesByResult} from '../splitMatchesByResult';

const NOW = new Date(2026, 8, 14, 12, 0); // 14. 9. 2026 12:00, lokální čas

const match = (
  id: string,
  date: string,
  status: MatchStatus,
  time: string | null = '09:00:00'
) => ({
  id,
  date,
  time,
  status,
});

describe('splitMatchesByResult', () => {
  it('proběhlý zápas bez výsledku nezmizí — patří mezi čekající', () => {
    // Případ zápasu č. 703: 12. 9., stav pořád `upcoming`.
    const {pending, completed} = splitMatchesByResult([
      match('703', '2026-09-12', MatchStatus.UPCOMING),
    ]);

    expect(pending.map((m) => m.id)).toEqual(['703']);
    expect(completed).toEqual([]);
  });

  it('každý zápas skončí právě v jedné skupině', () => {
    const matches = [
      match('past-upcoming', '2026-09-12', MatchStatus.UPCOMING),
      match('future-upcoming', '2026-09-20', MatchStatus.UPCOMING),
      match('past-completed', '2026-09-05', MatchStatus.COMPLETED),
      match('future-completed', '2026-09-20', MatchStatus.COMPLETED),
    ];

    const {pending, completed} = splitMatchesByResult(matches);

    expect(pending.length + completed.length).toBe(matches.length);
    expect(completed.map((m) => m.id)).toContain('future-completed');
  });

  it('čekající řadí od nejstaršího, odehrané od nejnovějšího — i podle času výkopu', () => {
    const {pending, completed} = splitMatchesByResult([
      match('b', '2026-09-12', MatchStatus.UPCOMING, '12:45:00'),
      match('a', '2026-09-12', MatchStatus.UPCOMING, '09:00:00'),
      match('c', '2026-09-20', MatchStatus.UPCOMING),
      match('x', '2026-09-05', MatchStatus.COMPLETED, '09:00:00'),
      match('y', '2026-09-05', MatchStatus.COMPLETED, '11:30:00'),
    ]);

    expect(pending.map((m) => m.id)).toEqual(['a', 'b', 'c']);
    expect(completed.map((m) => m.id)).toEqual(['y', 'x']);
  });
});

describe('isAwaitingResult', () => {
  it('zápas z minulosti bez výsledku čeká na výsledek', () => {
    expect(isAwaitingResult(match('703', '2026-09-12', MatchStatus.UPCOMING), NOW)).toBe(true);
  });

  it('dnešní zápas před výkopem ještě nečeká — rozhoduje lokální čas, ne půlnoc UTC', () => {
    expect(
      isAwaitingResult(match('dnes', '2026-09-14', MatchStatus.UPCOMING, '15:00:00'), NOW)
    ).toBe(false);
  });

  it('dnešní zápas po výkopu už čeká', () => {
    expect(
      isAwaitingResult(match('dnes', '2026-09-14', MatchStatus.UPCOMING, '09:00:00'), NOW)
    ).toBe(true);
  });

  it('odehraný zápas nečeká nikdy', () => {
    expect(isAwaitingResult(match('x', '2026-09-05', MatchStatus.COMPLETED), NOW)).toBe(false);
  });

  it('zápas bez času bere začátek dne', () => {
    expect(isAwaitingResult(match('t', '2026-09-20', MatchStatus.UPCOMING, null), NOW)).toBe(false);
  });
});
