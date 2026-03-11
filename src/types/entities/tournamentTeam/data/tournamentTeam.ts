import {TournamentTeamsInsert, TournamentTeamsSchema, TournamentTeamsUpdate} from '@/types';

export interface TournamentTeam extends TournamentTeamsSchema {}

export interface CreateTournamentTeam extends TournamentTeamsInsert {}

export interface UpdateTournamentTeam extends TournamentTeamsUpdate {}
