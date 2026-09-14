import {MatchStatus} from '@/enums';

type MatchLike = {
  status: MatchStatus | string;
  date: string;
  time?: string | null;
};

/**
 * Rozdělí zápasy na ty, které čekají na výsledek, a odehrané.
 *
 * Rozhoduje **jen stav**, ne datum. Dřív se k tomu přidávala podmínka na datum
 * (`upcoming && date >= now`, `completed && date <= now`) a zápas, jehož datum
 * proběhlo, ale výsledek ještě nikdo nezapsal, nesplnil ani jednu — z portálu
 * trenérů zmizel úplně. A s ním i tlačítko pro zápis výsledku, takže se to samo
 * neopravilo. 14. 9. 2026 takhle chybělo sedm zápasů (mimo jiné č. 703).
 *
 * Každý zápas proto skončí právě v jedné skupině. Že už datum proběhlo, pozná
 * volající přes `isAwaitingResult`.
 */
export function splitMatchesByResult<T extends MatchLike>(
  matches: T[]
): {pending: T[]; completed: T[]} {
  const pending: T[] = [];
  const completed: T[] = [];

  for (const match of matches) {
    (match.status === MatchStatus.COMPLETED ? completed : pending).push(match);
  }

  pending.sort((a, b) => kickoffTime(a) - kickoffTime(b));
  completed.sort((a, b) => kickoffTime(b) - kickoffTime(a));

  return {pending, completed};
}

/**
 * Zápas už začal, a pořád nemá zapsaný výsledek.
 */
export function isAwaitingResult(match: MatchLike, now: Date = new Date()): boolean {
  return match.status !== MatchStatus.COMPLETED && kickoffTime(match) <= now.getTime();
}

// Lokální čas výkopu. `new Date('2026-09-12')` by znamenalo půlnoc UTC, tedy
// 2:00 našeho času, a ranní zápas by se tvářil jako odehraný už v den utkání.
// Řetězec bez zóny s časem se naopak čte jako lokální.
function kickoffTime(match: MatchLike): number {
  const time = match.time ? match.time.slice(0, 8) : '00:00:00';
  return new Date(`${match.date.slice(0, 10)}T${time}`).getTime();
}
