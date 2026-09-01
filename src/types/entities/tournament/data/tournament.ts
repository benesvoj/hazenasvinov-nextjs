import {TournamentsInsert, TournamentsSchema, TournamentsUpdate} from '@/types';

export interface Tournament extends TournamentsSchema {}

export interface CreateTournament extends TournamentsInsert {}

export interface UpdateTournament extends TournamentsUpdate {}

export type TournamentFormData = Omit<Tournament, 'id' | 'created_at' | 'updated_at'>;

export interface TournamentMatch {
  id: string;
  round: number | null;
  date: string;
  time: string;
  venue: string | null;
  status: string | null;
  home_score: number | null;
  away_score: number | null;
  home_score_halftime: number | null;
  away_score_halftime: number | null;
  home_team_id: string | null;
  away_team_id: string | null;
  tournament_id: string | null;
  home_team: {
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
  } | null;
  away_team: {
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
  } | null;
}
