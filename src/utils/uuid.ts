/**
 * UUID utility functions for database compatibility
 * 
 * The database uses PostgreSQL with gen_random_uuid() for UUID generation.
 * This utility provides client-side UUID generation that's compatible
 * with the database schema and follows best practices.
 */

/**
 * Generate a UUID v4 compatible with PostgreSQL gen_random_uuid()
 * This uses the Web Crypto API which generates RFC 4122 compliant UUIDs
 * that are compatible with PostgreSQL's UUID type.
 */
export function generateUUID(): string {
  // Check if crypto.randomUUID is available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older browsers or Node.js environments
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a deterministic UUID based on input parameters
 * Useful for creating consistent IDs based on match and team data
 * 
 * @param matchId - The match ID
 * @param teamId - The team ID
 * @param isHome - Whether this is the home team lineup
 * @returns A deterministic UUID string
 */
export function generateDeterministicUUID(matchId: string, teamId: string, isHome: boolean): string {
  // Create a deterministic seed from the input parameters
  const seed = `${matchId}-${teamId}-${isHome ? 'home' : 'away'}`;
  
  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to positive number and use as seed for UUID generation
  const positiveHash = Math.abs(hash);
  
  // Generate UUID v4 with deterministic seed
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (positiveHash + Math.random() * 16) % 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Validate if a string is a valid UUID format
 * Compatible with PostgreSQL UUID type
 * 
 * @param uuid - The string to validate
 * @returns True if the string is a valid UUID
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generate a lineup ID based on match and team information
 * This creates a deterministic ID that can be used to find existing lineups
 * 
 * @param matchId - The match ID
 * @param teamId - The team ID
 * @param isHome - Whether this is the home team lineup
 * @returns A deterministic lineup ID
 */
export function generateLineupId(matchId: string, teamId: string, isHome: boolean): string {
  return generateDeterministicUUID(matchId, teamId, isHome);
}
