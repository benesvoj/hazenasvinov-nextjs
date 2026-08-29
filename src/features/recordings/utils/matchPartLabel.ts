// @barrel-ignore
import {translations} from '@/lib/translations';

import type {VideoMatchPart} from '@/types';

export function getMatchPartLabel(matchPart: string | null | undefined): string {
  if (!matchPart) return '-';
  return translations.matchRecordings.matchPartOptions[matchPart as VideoMatchPart] ?? '-';
}
