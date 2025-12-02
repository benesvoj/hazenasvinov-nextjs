import {SeasonInsert, SeasonSchema, SeasonUpdate} from "@/types";

/**
 * Season interface representing the database schema for seasons table.
 *
 * This interface defines the structure for seasons used throughout the application
 * for organizing category, matches, and competitions.
 */
export interface Season extends SeasonSchema {}

export interface CreateSeason extends SeasonInsert{}

export interface UpdateSeason extends SeasonUpdate{}

export type SeasonFormData = Omit<Season, 'id' | 'created_at' | 'updated_at'>;

export type SeasonCategoryPageData = Partial<Omit<SeasonSchema, 'id' | 'created_at' | 'updated_at'>>;