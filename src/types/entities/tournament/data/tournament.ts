import {TournamentsInsert, TournamentsSchema, TournamentsUpdate} from '@/types';

export interface Tournament extends TournamentsSchema {}

export interface CreateTournament extends TournamentsInsert {}

export interface UpdateTournament extends TournamentsUpdate {}

export type TournamentFormData = Omit<Tournament, 'id' | 'created_at' | 'updated_at'>;
