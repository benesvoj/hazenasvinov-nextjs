/**
 * Performance-optimized caching system for match queries
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  maxAge?: number; // Maximum age in milliseconds
}

class PerformanceCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private accessOrder: string[] = [];
  private readonly defaultTTL: number;
  private readonly maxSize: number;
  private readonly maxAge: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 100; // 100 entries default
    this.maxAge = options.maxAge || 30 * 60 * 1000; // 30 minutes default
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      ttl: ttl || this.defaultTTL,
      accessCount: 0,
      lastAccessed: now,
    };

    // Remove existing entry if it exists
    if (this.cache.has(key)) {
      this.remove(key);
    }

    // Check if we need to evict entries
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    this.accessOrder.push(key);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const now = Date.now();

    // Check if entry has expired
    if (now - entry.timestamp > entry.ttl) {
      this.remove(key);
      return null;
    }

    // Check if entry is too old
    if (now - entry.timestamp > this.maxAge) {
      this.remove(key);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = now;

    // Move to end of access order (most recently used)
    this.moveToEnd(key);

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  remove(key: string): boolean {
    const removed = this.cache.delete(key);
    if (removed) {
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    }
    return removed;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{
      key: string;
      age: number;
      accessCount: number;
      ttl: number;
    }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      accessCount: entry.accessCount,
      ttl: entry.ttl,
    }));

    const totalAccesses = entries.reduce((sum, entry) => sum + entry.accessCount, 0);
    const hitRate = totalAccesses > 0 ? entries.length / totalAccesses : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate,
      entries: entries.sort((a, b) => b.accessCount - a.accessCount),
    };
  }

  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const lruKey = this.accessOrder[0];
    this.remove(lruKey);
  }

  private moveToEnd(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
      this.accessOrder.push(key);
    }
  }
}

// Create specialized cache instances for different data types
export const matchCache = new PerformanceCache({
  ttl: 2 * 60 * 1000, // 2 minutes for match data
  maxSize: 50,
  maxAge: 10 * 60 * 1000, // 10 minutes max age
});

export const teamCache = new PerformanceCache({
  ttl: 10 * 60 * 1000, // 10 minutes for team data (changes less frequently)
  maxSize: 100,
  maxAge: 30 * 60 * 1000, // 30 minutes max age
});

export const categoryCache = new PerformanceCache({
  ttl: 15 * 60 * 1000, // 15 minutes for category data (rarely changes)
  maxSize: 20,
  maxAge: 60 * 60 * 1000, // 1 hour max age
});

// Cache key generators
export const cacheKeys = {
  matches: {
    basic: (options: any) => `matches:basic:${JSON.stringify(options)}`,
    withTeams: (options: any) => `matches:teams:${JSON.stringify(options)}`,
    seasonal: (categoryId: string, seasonId: string) =>
      `matches:seasonal:${categoryId}:${seasonId}`,
    ownClub: (categoryId: string, seasonId: string) => `matches:ownclub:${categoryId}:${seasonId}`,
  },
  teams: {
    byId: (teamId: string) => `team:${teamId}`,
    byClub: (clubId: string) => `teams:club:${clubId}`,
  },
  categories: {
    all: 'category:all',
    byId: (id: string) => `category:${id}`,
    bySlug: (slug: string) => `category:slug:${slug}`,
  },
  seasons: {
    active: 'seasons:active',
    all: 'seasons:all',
    byId: (id: string) => `season:${id}`,
  },
};

// Cache invalidation helpers
export const invalidateCache = {
  matches: () => {
    matchCache.clear();
  },
  matchesByCategory: (categoryId: string) => {
    // Remove all match entries for this category
    const stats = matchCache.getStats();
    stats.entries.forEach((entry) => {
      if (entry.key.includes(categoryId)) {
        matchCache.remove(entry.key);
      }
    });
  },
  matchesBySeason: (seasonId: string) => {
    // Remove all match entries for this season
    const stats = matchCache.getStats();
    stats.entries.forEach((entry) => {
      if (entry.key.includes(seasonId)) {
        matchCache.remove(entry.key);
      }
    });
  },
  teams: () => {
    teamCache.clear();
  },
  categories: () => {
    categoryCache.clear();
  },
  all: () => {
    matchCache.clear();
    teamCache.clear();
    categoryCache.clear();
  },
};

// Performance monitoring
export const performanceMonitor = {
  getStats: () => ({
    matches: matchCache.getStats(),
    teams: teamCache.getStats(),
    categories: categoryCache.getStats(),
  }),

  logStats: () => {
    const stats = performanceMonitor.getStats();
    console.group('🚀 Performance Cache Stats');
    console.log('Matches:', stats.matches);
    console.log('Teams:', stats.teams);
    console.log('Categories:', stats.categories);
    console.groupEnd();
  },

  reset: () => {
    invalidateCache.all();
  },
};

export default PerformanceCache;
