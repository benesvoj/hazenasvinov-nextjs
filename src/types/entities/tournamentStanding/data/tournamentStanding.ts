import {
  TournamentStandingsInsert,
  TournamentStandingsSchema,
  TournamentStandingsUpdate,
} from '@/types';

export interface TournamentStanding extends TournamentStandingsSchema {}

export interface CreateTournamentStanding extends TournamentStandingsInsert {}

export interface UpdateTournamentStanding extends TournamentStandingsUpdate {}
