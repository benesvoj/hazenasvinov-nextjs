/**
 * @fileoverview Coach Authorization Helpers - SERVER ONLY
 *
 * Provides role checking and ownership verification for coach operations.
 * Import only in API routes.
 */

import {SupabaseClient, User} from '@supabase/supabase-js';

/**
 * Roles that are considered "coach" roles
 */
export const COACH_ROLES = ['coach', 'head_coach'] as const;
export type CoachRole = (typeof COACH_ROLES)[number];

/**
 * Check if user has a coach role
 *
 * @param supabase - Supabase client
 * @param userId - User ID to check
 * @returns true if user has coach role
 *
 * @example
 * const isCoach = await hasCoachRole(supabase, user.id);
 * if (!isCoach) {
 *   return errorResponse('Only coaches can perform this action', 403);
 * }
 */
export async function hasCoachRole(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const {data: profile} = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (!profile?.role) return false;
  return COACH_ROLES.includes(profile.role as CoachRole);
}

/**
 * Check if user is admin
 *
 * @param supabase - Supabase client
 * @param userId - User ID to check
 * @returns true if user is admin
 */
export async function isAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const {data: profile} = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', userId)
    .single();

  return profile?.role === 'admin';
}

/**
 * Check if user owns a specific coach card
 *
 * @param supabase - Supabase client
 * @param cardId - Coach card ID
 * @param userId - User ID to check
 * @returns true if user owns the card
 *
 * @example
 * const isOwner = await isCoachCardOwner(supabase, cardId, user.id);
 * if (!isOwner) {
 *   return errorResponse('You can only edit your own coach card', 403);
 * }
 */
export async function isCoachCardOwner(
  supabase: SupabaseClient,
  cardId: string,
  userId: string
): Promise<boolean> {
  const {data: card} = await supabase
    .from('coach_cards')
    .select('user_id')
    .eq('id', cardId)
    .single();

  return card?.user_id === userId;
}

/**
 * Combined authorization check for coach card operations
 *
 * @param supabase - Supabase client
 * @param cardId - Coach card ID
 * @param userId - User ID
 * @param operation - 'read' | 'write' | 'delete'
 * @returns Authorization result with reason if denied
 */
export async function checkCoachCardAccess(
  supabase: SupabaseClient,
  cardId: string,
  userId: string,
  operation: 'read' | 'write' | 'delete'
): Promise<{allowed: boolean; reason?: string}> {
  const [ownerCheck, adminCheck] = await Promise.all([
    isCoachCardOwner(supabase, cardId, userId),
    isAdmin(supabase, userId),
  ]);

  // Owner can do everything with their own card
  if (ownerCheck) {
    return {allowed: true};
  }

  // Admin can read and delete, but NOT write (respect coach's personal data)
  if (adminCheck) {
    if (operation === 'write') {
      return {allowed: false, reason: 'Admins cannot edit coach personal cards'};
    }
    return {allowed: true};
  }

  return {allowed: false, reason: 'You do not have access to this coach card'};
}
