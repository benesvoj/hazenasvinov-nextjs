import {translations} from '@/lib/translations';

const t = translations.tournaments.enums.statuses;

export enum TournamentStatuses {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export const TOURNAMENT_STATUSES: Record<TournamentStatuses, string> = {
  [TournamentStatuses.DRAFT]: t.draft,
  [TournamentStatuses.PUBLISHED]: t.published,
  [TournamentStatuses.ARCHIVED]: t.archived,
} as const;

export const getTournamentStatusOptions = () =>
  Object.entries(TOURNAMENT_STATUSES).map(([value, label]) => ({
    value: value as TournamentStatuses,
    label,
  }));
