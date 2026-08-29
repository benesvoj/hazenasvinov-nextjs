import {hasItems} from '@/utils/arrayHelper';

/** Minimal shape needed to judge whether a member may receive a new record. */
interface ActivityFlag {
  is_active?: boolean | null;
}

interface AttendanceCandidateMember extends ActivityFlag {
  id: string;
  category_id?: string | null;
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
