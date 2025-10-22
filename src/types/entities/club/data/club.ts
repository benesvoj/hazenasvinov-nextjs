import {ClubInsert, ClubSchema, ClubUpdate} from '@/types';

export interface Club extends ClubSchema {}

export interface NewClub extends ClubInsert {}

export interface UpdateClub extends ClubUpdate {}
