/**
 * Formats a member as "Příjmení Jméno" for headings and dialog subtitles.
 *
 * The member view types declare both parts as nullable, so missing values are
 * dropped instead of being interpolated — a subtitle reading "null null" is
 * worse than no subtitle at all. Returns an empty string when nothing is known.
 */
export function getMemberFullName(
  member?: {name?: string | null; surname?: string | null} | null
): string {
  return [member?.surname, member?.name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');
}
