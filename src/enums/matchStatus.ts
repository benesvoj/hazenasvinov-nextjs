import {translations} from '@/lib/translations/index';

export enum MatchStatus {
  UPCOMING = 'upcoming',
  COMPLETED = 'completed',
}

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  [MatchStatus.UPCOMING]: translations.matches.statuses.upcoming,
  [MatchStatus.COMPLETED]: translations.matches.statuses.completed,
};

export const getMatchStatusOptions = () =>
  Object.entries(MATCH_STATUS_LABELS).map(([value, label]) => ({
    value: value as MatchStatus,
    label,
  }));
