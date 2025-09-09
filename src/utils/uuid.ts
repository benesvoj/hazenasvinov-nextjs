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
 * Simple Linear Congruential Generator (LCG) for deterministic random numbers
 * This creates a seeded random number generator that produces consistent results
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // LCG formula: (a * seed + c) % m
  // Using constants from Numerical Recipes
  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296; // Normalize to [0, 1)
  }

  // Generate a random integer in range [0, max)
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}

/**
 * Generate a deterministic UUID based on input parameters
 * Uses a seeded random number generator to ensure true determinism
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
  
  // Convert to positive number and use as seed for deterministic generation
  const positiveHash = Math.abs(hash);
  
  // Create seeded random number generator
  const rng = new SeededRandom(positiveHash);
  
  // Generate UUID v4 with deterministic values
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = rng.nextInt(16);
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

/**
 * Test function to verify deterministic UUID generation
 * This ensures that the same inputs always produce the same UUID
 * 
 * @returns True if all tests pass, false otherwise
 */
export function testDeterministicUUID(): boolean {
  const testCases = [
    { matchId: 'match-1', teamId: 'team-1', isHome: true },
    { matchId: 'match-1', teamId: 'team-1', isHome: false },
    { matchId: 'match-2', teamId: 'team-1', isHome: true },
    { matchId: 'match-1', teamId: 'team-2', isHome: true },
  ];

  for (const testCase of testCases) {
    // Generate UUID multiple times with same inputs
    const uuid1 = generateDeterministicUUID(testCase.matchId, testCase.teamId, testCase.isHome);
    const uuid2 = generateDeterministicUUID(testCase.matchId, testCase.teamId, testCase.isHome);
    const uuid3 = generateDeterministicUUID(testCase.matchId, testCase.teamId, testCase.isHome);

    // All should be identical
    if (uuid1 !== uuid2 || uuid2 !== uuid3) {
      console.error('Deterministic UUID test failed:', testCase, { uuid1, uuid2, uuid3 });
      return false;
    }

    // Should be valid UUIDs
    if (!isValidUUID(uuid1)) {
      console.error('Generated UUID is not valid:', uuid1);
      return false;
    }
  }

  console.log('✅ All deterministic UUID tests passed');
  return true;
}
