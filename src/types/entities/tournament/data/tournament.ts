import {TournamentsInsert, TournamentsSchema, TournamentsUpdate} from '@/types';

export interface Tournament extends TournamentsSchema {}

export interface CreateTournament extends TournamentsInsert {}

export interface UpdateTournament extends TournamentsUpdate {}

export type TournamentFormData = Omit<Tournament, 'id' | 'created_at' | 'updated_at'>;

export interface TournamentMatch {
  id: string;
  round: number;
  date: string;
  time: string;
  venue: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_score_halftime: number | null;
  away_score_halftime: number | null;
  home_team_id: string;
  away_team_id: string;
  tournament_id: string;
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
  };
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
  };
}
