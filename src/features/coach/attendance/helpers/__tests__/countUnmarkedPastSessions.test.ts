import {describe, expect, it} from 'vitest';

import {TrainingSessionStatusEnum} from '@/enums';
import {countUnmarkedPastSessions} from '@/features/coach/attendance/helpers';
import {BaseTrainingSession} from '@/types';

const TODAY = new Date(2026, 8, 7); // 7. 9. 2026, lokální čas

const session = (
  session_date: string,
  status: TrainingSessionStatusEnum = TrainingSessionStatusEnum.PLANNED
) => ({session_date, status}) as BaseTrainingSession;

describe('countUnmarkedPastSessions', () => {
  it('počítá naplánované tréninky z minulosti', () => {
    const count = countUnmarkedPastSessions(
      [session('2026-08-24'), session('2026-09-03'), session('2026-09-05')],
      TODAY
    );

    expect(count).toBe(3);
  });

  it('nepočítá tréninky, které teprve přijdou', () => {
    const count = countUnmarkedPastSessions([session('2026-09-08'), session('2026-10-01')], TODAY);

    expect(count).toBe(0);
  });

  it('dnešek se ještě nepočítá — trénink může být večer', () => {
    const count = countUnmarkedPastSessions([session('2026-09-07')], TODAY);

    expect(count).toBe(0);
  });

  it('ignoruje tréninky, které už mají stav Proběhlo nebo Zrušeno', () => {
    const count = countUnmarkedPastSessions(
      [
        session('2026-08-24', TrainingSessionStatusEnum.DONE),
        session('2026-08-26', TrainingSessionStatusEnum.CANCELLED),
        session('2026-08-28'),
      ],
      TODAY
    );

    expect(count).toBe(1);
  });

  it('snese datum s časovou složkou i chybějící datum', () => {
    const count = countUnmarkedPastSessions(
      [
        session('2026-08-24T18:00:00+02:00'),
        {status: TrainingSessionStatusEnum.PLANNED} as BaseTrainingSession,
      ],
      TODAY
    );

    expect(count).toBe(1);
  });

  it('prázdný seznam vrací nulu', () => {
    expect(countUnmarkedPastSessions([], TODAY)).toBe(0);
  });
});
