import {TournamentTeamsInsert, TournamentTeamsSchema, TournamentTeamsUpdate} from '@/types';

export interface TournamentTeam extends TournamentTeamsSchema {}

export interface CreateTournamentTeam extends TournamentTeamsInsert {}

export interface UpdateTournamentTeam extends TournamentTeamsUpdate {}

export interface TournamentTeamQuery extends TournamentTeam {
  team: {
    id: string;
    team_suffix: string | null;
    club_category: {
      club: {
        id: string;
        name: string;
        short_name: string | null;
        logo_url: string | null;
      };
    };
  };
}
