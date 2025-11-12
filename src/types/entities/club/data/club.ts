import {ClubInsert, ClubSchema, ClubUpdate, Committee} from '@/types';

export interface Club extends ClubSchema {}

export interface NewClub extends ClubInsert {}

export interface UpdateClub extends ClubUpdate {}

export type ClubFormData = Omit<Club, 'id' | 'created_at' | 'updated_at'>;

export interface UseClubsFilters {
  searchTerm?: string;
  isActive?: boolean;
}
