import {CoachCardSchema, CoachCardsWithCategoriesSchema} from '@/types';

/**
 * Core coach card data as stored in database
 */
export interface CoachCard extends CoachCardSchema {}

/**
 * Coach card with additional user profile data
 * Used in coach portal to show available categories for publishing
 */
export interface CoachCardWithCategories extends CoachCard {
  /**
   * Categories the coach is assigned to (from user_profiles).
   * These are the categories the coach CAN publish to.
   */
  assigned_categories: string[];
  role: 'coach' | 'head_coach' | 'admin';
}

/**
 * Coach card for public display (filtered fields)
 */
export interface PublicCoachCard {
  id: string;
  name: string;
  surname: string;
  email: string | null;
  phone: string | null;
  note: string | null;
  photo_url: string | null;
}
