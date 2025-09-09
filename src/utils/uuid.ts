/**
 * UUID utility functions for database compatibility
 * 
 * The database uses PostgreSQL with gen_random_uuid() for UUID generation.
 * This utility provides client-side UUID generation that's compatible
 * with the database schema and follows best practices.
 */

/**
 * Generate a UUID v4 compatible with PostgreSQL gen_random_uuid()
 * 
 * SECURITY NOTICE:
 * - Uses Web Crypto API (crypto.randomUUID) when available - CRYPTOGRAPHICALLY SECURE
 * - Falls back to Math.random() in older environments - NOT CRYPTOGRAPHICALLY SECURE
 * 
 * For non-critical use cases (UI IDs, temporary identifiers), the fallback is acceptable.
 * For security-critical use cases (tokens, session IDs), ensure crypto.randomUUID is available.
 * 
 * @returns RFC 4122 compliant UUID v4 string
 */
export function generateUUID(): string {
  // Check if crypto.randomUUID is available (modern browsers and Node.js 19+)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Check if crypto.getRandomValues is available (more secure than Math.random)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    
    // Set version (4) and variant bits
    array[6] = (array[6] & 0x0f) | 0x40; // Version 4
    array[8] = (array[8] & 0x3f) | 0x80; // Variant bits
    
    // Convert to UUID string format
    const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32)
    ].join('-');
  }
  
  // Fallback for very old environments - NOT CRYPTOGRAPHICALLY SECURE
  // This should only be used for non-security-critical identifiers
  console.warn('UUID generation: Using non-cryptographically secure fallback (Math.random). Consider upgrading to a modern environment with crypto.randomUUID support.');
  
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
 * Check if cryptographically secure UUID generation is available
 * 
 * @returns True if crypto.randomUUID is available, false otherwise
 */
export function isSecureUUIDAvailable(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function';
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
 * Generate a cryptographically secure UUID v4
 * 
 * This function will throw an error if crypto.randomUUID is not available,
 * ensuring that only cryptographically secure UUIDs are generated.
 * 
 * Use this for security-critical identifiers like:
 * - Session tokens
 * - API keys
 * - Authentication tokens
 * - Any identifier that requires cryptographic security
 * 
 * @returns RFC 4122 compliant UUID v4 string
 * @throws Error if crypto.randomUUID is not available
 */
export function generateSecureUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  throw new Error(
    'Cryptographically secure UUID generation requires crypto.randomUUID, which is not available in this environment. ' +
    'Consider upgrading to a modern browser or Node.js 19+ environment.'
  );
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
