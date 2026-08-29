import {TournamentStatuses} from '@/enums/tournamentStatuses';

import {translations} from '@/lib/translations';

export function tournamentStatuses() {
  const t = translations.tournaments.enums.statuses;

  return {
    [TournamentStatuses.DRAFT]: t.draft,
    [TournamentStatuses.PUBLISHED]: t.published,
    [TournamentStatuses.ARCHIVED]: t.archived,
  };
}
export const getTournamentStatusOptions = () => {
  const labels = tournamentStatuses();

  return Object.entries(labels).map(([value, label]) => ({
    value: value as TournamentStatuses,
    label,
  }));
};
