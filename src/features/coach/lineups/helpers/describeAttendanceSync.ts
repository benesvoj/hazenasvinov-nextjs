import {TrainingSessionStatusEnum} from '@/enums';

/** Minimal shape of a training session needed to place it on one side of the split. */
export interface SyncSession {
  id: string;
  status: string | null;
  session_date: string;
}

/** Minimal shape of an attendance row: which member, which session. */
export interface SyncAttendanceRow {
  member_id: string;
  training_session_id: string;
}

/** What is out of sync for one member of the lineup. */
export interface MemberAttendanceSync {
  memberId: string;
  /**
   * Sessions still marked `planned` that hold no record for this member — what
   * "add to future sessions only" would create.
   */
  missingPlanned: number;
  /**
   * Sessions in any other state (`done`, `cancelled`) with no record — the
   * difference between "add everywhere" and "add to planned only".
   */
  missingOther: number;
  /** missingPlanned + missingOther. Zero means the member needs no action. */
  missingTotal: number;
  /**
   * Records this member already has in `planned` sessions — what removing them
   * from the lineup would delete.
   */
  recordedInPlanned: number;
  /**
   * Of `recordedInPlanned`, how many sit on a session whose date has already
   * passed. Nobody flips training sessions to `done` in practice, so `planned`
   * is full of sessions that already happened and carry real attendance. The
   * destructive dialog shows this number rather than hiding it behind the
   * word "future".
   */
  recordedInPlannedPast: number;
}

export interface AttendanceSyncSummary {
  /** One entry per lineup member, in the order the member ids were given. */
  members: MemberAttendanceSync[];
  /** Members with `missingTotal > 0`. */
  membersOutOfSync: number;
  /** Sum of `missingTotal` across the lineup. */
  missingRecords: number;
  /** Sessions the summary was computed over. */
  totalSessions: number;
  plannedSessions: number;
}

interface DescribeAttendanceSyncParams {
  /** Member ids on the lineup — deactivated members must be filtered out upstream. */
  memberIds: string[];
  /** Every training session of the category and season. */
  sessions: SyncSession[];
  /** Attendance rows for those sessions. Rows for other sessions are ignored. */
  attendance: SyncAttendanceRow[];
  /** Injected so tests do not depend on the clock. Defaults to today. */
  today?: string;
}

const isPlanned = (session: SyncSession) => session.status === TrainingSessionStatusEnum.PLANNED;

const todayAsDateString = () => new Date().toISOString().slice(0, 10);

/**
 * Compares a lineup against the attendance sheets of its category and season.
 *
 * Attendance is generated once, when a training session is created, from
 * whoever was on the lineup at that moment. Nothing revisits it, so every
 * later change to the lineup leaves the sheets behind: a player added in
 * September is absent from every session created in August, and one removed
 * keeps appearing on sessions that have not happened yet.
 *
 * This function only measures the gap. Which side of the split gets acted on —
 * and with which attendance status — is the coach's decision, made in the
 * dialog.
 */
export function describeAttendanceSync({
  memberIds,
  sessions,
  attendance,
  today = todayAsDateString(),
}: DescribeAttendanceSyncParams): AttendanceSyncSummary {
  const sessionById = new Map(sessions.map((session) => [session.id, session]));

  /** member id -> ids of sessions that already hold a record for them. */
  const recordedSessions = new Map<string, Set<string>>();
  for (const row of attendance) {
    // An attendance row can point at a session from another category or season;
    // those must not count towards this lineup's coverage.
    if (!sessionById.has(row.training_session_id)) continue;

    const forMember = recordedSessions.get(row.member_id) ?? new Set<string>();
    forMember.add(row.training_session_id);
    recordedSessions.set(row.member_id, forMember);
  }

  const plannedSessions = sessions.filter(isPlanned);

  const members: MemberAttendanceSync[] = memberIds.map((memberId) => {
    const recorded = recordedSessions.get(memberId) ?? new Set<string>();

    let missingPlanned = 0;
    let missingOther = 0;
    let recordedInPlanned = 0;
    let recordedInPlannedPast = 0;

    for (const session of sessions) {
      const hasRecord = recorded.has(session.id);
      const planned = isPlanned(session);

      if (!hasRecord) {
        if (planned) missingPlanned += 1;
        else missingOther += 1;
        continue;
      }

      if (planned) {
        recordedInPlanned += 1;
        if (session.session_date < today) recordedInPlannedPast += 1;
      }
    }

    return {
      memberId,
      missingPlanned,
      missingOther,
      missingTotal: missingPlanned + missingOther,
      recordedInPlanned,
      recordedInPlannedPast,
    };
  });

  return {
    members,
    membersOutOfSync: members.filter((member) => member.missingTotal > 0).length,
    missingRecords: members.reduce((sum, member) => sum + member.missingTotal, 0),
    totalSessions: sessions.length,
    plannedSessions: plannedSessions.length,
  };
}

/** Which sessions an add/remove action should touch. */
export enum AttendanceSyncScope {
  /** Every training session of the category and season. */
  ALL = 'all',
  /** Only sessions still marked `planned`. */
  PLANNED = 'planned',
}

/**
 * The session ids an action of the given scope would write to.
 *
 * Kept next to the summary so the API and the dialog cannot disagree about
 * what "planned" means.
 */
export function selectSessionsForScope(
  sessions: SyncSession[],
  scope: AttendanceSyncScope
): SyncSession[] {
  return scope === AttendanceSyncScope.PLANNED ? sessions.filter(isPlanned) : sessions;
}
