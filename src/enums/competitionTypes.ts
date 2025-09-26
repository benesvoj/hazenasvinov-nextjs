import {translations} from '@/lib/translations';

const t = translations.common.competitionTypes;

export enum CompetitionTypes {
  LEAGUE = 'league',
  LEAGUE_PLAYOFF = 'league_playoff',
  TOURNAMENT = 'tournament',
}

export const COMPETITION_TYPES: Record<CompetitionTypes, string> = {
  [CompetitionTypes.LEAGUE]: t.league,
  [CompetitionTypes.LEAGUE_PLAYOFF]: t.league_playoff,
  [CompetitionTypes.TOURNAMENT]: t.tournament,
};

export const getCompetitionTypeOptions = () =>
  Object.entries(COMPETITION_TYPES).map(([value, label]) => ({
    value: value as CompetitionTypes,
    label,
  }));
