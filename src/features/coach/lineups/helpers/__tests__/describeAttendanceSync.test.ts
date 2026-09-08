import {describe, expect, it} from 'vitest';

import {TrainingSessionStatusEnum} from '@/enums';
import {
  AttendanceSyncScope,
  describeAttendanceSync,
  selectSessionsForScope,
  SyncSession,
} from '@/features/coach/lineups/helpers/describeAttendanceSync';

const TODAY = '2026-09-08';

const session = (
  id: string,
  session_date: string,
  status: TrainingSessionStatusEnum = TrainingSessionStatusEnum.PLANNED
): SyncSession => ({id, session_date, status});

const record = (member_id: string, training_session_id: string) => ({
  member_id,
  training_session_id,
});

describe('describeAttendanceSync', () => {
  it('člen, který má záznam v každém tréninku, nepotřebuje nic', () => {
    const summary = describeAttendanceSync({
      memberIds: ['anna'],
      sessions: [session('s1', '2026-08-31'), session('s2', '2026-09-10')],
      attendance: [record('anna', 's1'), record('anna', 's2')],
      today: TODAY,
    });

    expect(summary.members[0].missingTotal).toBe(0);
    expect(summary.membersOutOfSync).toBe(0);
    expect(summary.missingRecords).toBe(0);
  });

  it('rozděluje chybějící záznamy na naplánované a ostatní tréninky', () => {
    const summary = describeAttendanceSync({
      memberIds: ['anna'],
      sessions: [
        session('s1', '2026-08-31', TrainingSessionStatusEnum.DONE),
        session('s2', '2026-09-02', TrainingSessionStatusEnum.CANCELLED),
        session('s3', '2026-09-10'),
        session('s4', '2026-09-12'),
      ],
      attendance: [],
      today: TODAY,
    });

    expect(summary.members[0]).toMatchObject({
      missingPlanned: 2,
      missingOther: 2,
      missingTotal: 4,
    });
    expect(summary.plannedSessions).toBe(2);
    expect(summary.totalSessions).toBe(4);
  });

  // Reálný případ z produkce: Velimová Anna byla na soupisku Dorostenek přidána
  // 30. 8., chybí ve 26 z 27 tréninků sezóny.
  it('člen přidaný na soupisku v průběhu sezóny chybí ve starších trénincích', () => {
    const sessions = Array.from({length: 27}, (_, i) =>
      session(`s${i}`, `2026-09-${String((i % 28) + 1).padStart(2, '0')}`)
    );

    const summary = describeAttendanceSync({
      memberIds: ['velimova', 'ostatni'],
      sessions,
      attendance: [record('velimova', 's26'), ...sessions.map((s) => record('ostatni', s.id))],
      today: TODAY,
    });

    expect(summary.members[0].missingTotal).toBe(26);
    expect(summary.members[1].missingTotal).toBe(0);
    expect(summary.membersOutOfSync).toBe(1);
    expect(summary.missingRecords).toBe(26);
  });

  it('počítá záznamy v naplánovaných trénincích, které by mazání odstranilo', () => {
    const summary = describeAttendanceSync({
      memberIds: ['anna'],
      sessions: [
        session('s1', '2026-08-31'),
        session('s2', '2026-09-01'),
        session('s3', '2026-09-20'),
        session('s4', '2026-09-25', TrainingSessionStatusEnum.DONE),
      ],
      attendance: [
        record('anna', 's1'),
        record('anna', 's2'),
        record('anna', 's3'),
        record('anna', 's4'),
      ],
      today: TODAY,
    });

    expect(summary.members[0].recordedInPlanned).toBe(3);
    // s1 a s2 už proběhly, přestože mají stav Naplánováno — nikdo tréninky
    // nepřeklápí na Proběhlo, takže „budoucí" podle stavu zahrnuje i minulost.
    expect(summary.members[0].recordedInPlannedPast).toBe(2);
  });

  it('dnešní trénink se ještě nepočítá jako proběhlý', () => {
    const summary = describeAttendanceSync({
      memberIds: ['anna'],
      sessions: [session('s1', TODAY)],
      attendance: [record('anna', 's1')],
      today: TODAY,
    });

    expect(summary.members[0].recordedInPlannedPast).toBe(0);
  });

  it('ignoruje docházku z tréninků mimo předanou sadu', () => {
    const summary = describeAttendanceSync({
      memberIds: ['anna'],
      sessions: [session('s1', '2026-09-10')],
      attendance: [record('anna', 'jina-sezona')],
      today: TODAY,
    });

    expect(summary.members[0].missingTotal).toBe(1);
  });

  it('prázdná soupiska nevrací žádné členy', () => {
    const summary = describeAttendanceSync({
      memberIds: [],
      sessions: [session('s1', '2026-09-10')],
      attendance: [],
      today: TODAY,
    });

    expect(summary.members).toEqual([]);
    expect(summary.membersOutOfSync).toBe(0);
  });

  it('kategorie bez tréninků nehlásí nic k dogenerování', () => {
    const summary = describeAttendanceSync({
      memberIds: ['anna', 'bara'],
      sessions: [],
      attendance: [],
      today: TODAY,
    });

    expect(summary.missingRecords).toBe(0);
    expect(summary.totalSessions).toBe(0);
  });
});

describe('selectSessionsForScope', () => {
  const sessions = [
    session('s1', '2026-08-31', TrainingSessionStatusEnum.DONE),
    session('s2', '2026-09-10'),
    session('s3', '2026-09-12', TrainingSessionStatusEnum.CANCELLED),
  ];

  it('rozsah „vše" vrací všechny tréninky', () => {
    expect(selectSessionsForScope(sessions, AttendanceSyncScope.ALL)).toHaveLength(3);
  });

  it('rozsah „naplánované" vrací jen tréninky ve stavu Naplánováno', () => {
    const selected = selectSessionsForScope(sessions, AttendanceSyncScope.PLANNED);

    expect(selected.map((s) => s.id)).toEqual(['s2']);
  });
});
