import {TrainingSessionStatusEnum} from '@/enums';
import {BaseTrainingSession} from '@/types';

/**
 * Kolik tréninků už proběhlo, ale zůstalo ve stavu Naplánováno.
 *
 * Statistiky docházky (`get_member_attendance_stats`) počítají jen tréninky se
 * stavem `done`. Generátor ale zakládá všechno jako `planned` a nic to
 * nepřeklápí, takže trenér, který stav neupraví, vidí ve statistikách nuly,
 * i když docházku poctivě zapisuje. Tohle je podklad pro upozornění, které mu
 * to na stránce vysvětlí.
 *
 * Dnešek se počítá jako „ještě neproběhl" — trénink může být večer.
 */
export function countUnmarkedPastSessions(
  sessions: BaseTrainingSession[],
  today: Date = new Date()
): number {
  const todayIso = toIsoDate(today);

  return sessions.filter(
    (session) =>
      session.status === TrainingSessionStatusEnum.PLANNED &&
      typeof session.session_date === 'string' &&
      session.session_date.slice(0, 10) < todayIso
  ).length;
}

// Lokální datum, ne UTC: toISOString() by u půlnočních hraničních časů posunul
// den o jeden zpět a trénink z dneška by se označil jako zmeškaný.
function toIsoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
