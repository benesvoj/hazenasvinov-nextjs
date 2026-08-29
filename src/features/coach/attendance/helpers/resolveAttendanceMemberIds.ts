import {hasItems} from '@/utils/arrayHelper';

/** Minimal shape needed to judge whether a member may receive a new record. */
interface ActivityFlag {
  is_active?: boolean | null;
}

interface AttendanceCandidateMember extends ActivityFlag {
  id: string;
  category_id?: string | null;
  /** Only read to name the members a lineup leaves out. */
  name?: string | null;
  surname?: string | null;
}

interface AttendanceCandidateLineupMember {
  members?: AttendanceCandidateMember | null;
}

interface ResolveAttendanceMemberIdsParams {
  /** Members of the active lineup (soupiska) for the selected category. */
  lineupMembers: AttendanceCandidateLineupMember[];
  /** Fallback pool used when the category has no lineup members. */
  categoryMembers: AttendanceCandidateMember[];
  categoryId: string;
}

/**
 * Only an explicit `false` excludes a member.
 *
 * Both sources are already filtered upstream (the lineup query drops
 * deactivated members, `/api/members` returns active ones by default), so this
 * is a second line of defence rather than the primary one. Treating a missing
 * flag as "deactivated" would be the worse failure: a select that stops
 * returning the column would silently generate an empty attendance sheet, which
 * reads as a broken feature instead of a wrong one.
 */
const isDeactivated = (member?: ActivityFlag | null): boolean => member?.is_active === false;

/**
 * Picks the members a newly created attendance sheet should cover.
 *
 * Preference order: the active lineup for the category, falling back to every
 * member of the category when no lineup exists yet.
 *
 * Deactivated (vyřazení) members are never returned — they must not appear in
 * records created from now on. Records that already exist for them are
 * untouched and stay visible; this function only decides what gets created.
 */
export function resolveAttendanceMemberIds({
  lineupMembers,
  categoryMembers,
  categoryId,
}: ResolveAttendanceMemberIdsParams): string[] {
  const fromLineup = lineupMembers
    .filter((lineupMember) => !isDeactivated(lineupMember.members))
    .map((lineupMember) => lineupMember.members?.id)
    .filter((id): id is string => Boolean(id));

  if (hasItems(fromLineup)) return fromLineup;

  return categoryMembers
    .filter((member) => member.category_id === categoryId && !isDeactivated(member))
    .map((member) => member.id);
}

export interface LineupCoverage {
  /** Members a newly generated attendance sheet would cover. */
  covered: number;
  /** Active members of the category. */
  categoryTotal: number;
  /** Surnames and names of active category members the lineup leaves out. */
  missing: string[];
  /**
   * True when the lineup is what attendance will be built from and it does not
   * hold the whole squad.
   */
  isIncomplete: boolean;
}

interface DescribeLineupCoverageParams extends ResolveAttendanceMemberIdsParams {
  /** Used only to name the members left out. */
  memberName?: (member: AttendanceCandidateMember) => string;
}

/**
 * Describes what a newly generated attendance sheet would and would not cover.
 *
 * `resolveAttendanceMemberIds` is all-or-nothing on purpose: a lineup holding a
 * single player wins over a category holding twelve, because the lineup is
 * meant to be the roster. In practice lineups go stale, and the coach then gets
 * an attendance sheet for one person with nothing saying why.
 *
 * This does not change that behaviour — it makes it visible, so the answer is
 * to fix the lineup rather than to have the code quietly guess around it.
 */
export function describeLineupCoverage({
  lineupMembers,
  categoryMembers,
  categoryId,
  memberName = (m) => m.id,
}: DescribeLineupCoverageParams): LineupCoverage {
  const activeInCategory = categoryMembers.filter(
    (member) => member.category_id === categoryId && !isDeactivated(member)
  );
  const resolved = new Set(
    resolveAttendanceMemberIds({lineupMembers, categoryMembers, categoryId})
  );

  const missing = activeInCategory.filter((member) => !resolved.has(member.id)).map(memberName);

  return {
    covered: resolved.size,
    categoryTotal: activeInCategory.length,
    missing,
    isIncomplete: resolved.size > 0 && missing.length > 0,
  };
}
