/**
 * Centralized query keys for consistent caching and invalidation
 */

export const queryKeys = {
  // Match queries
  matches: {
    all: ['matches'] as const,
    lists: () => [...queryKeys.matches.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.matches.lists(), filters] as const,
    details: () => [...queryKeys.matches.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.matches.details(), id] as const,

    // Specific match queries
    byCategory: (categoryId: string, seasonId?: string) =>
      [...queryKeys.matches.lists(), 'category', categoryId, seasonId] as const,
    bySeason: (seasonId: string, categoryId?: string) =>
      [...queryKeys.matches.lists(), 'season', seasonId, categoryId] as const,
    ownClub: (categoryId?: string, seasonId?: string) =>
      [...queryKeys.matches.lists(), 'ownClub', categoryId, seasonId] as const,
    public: (categoryId?: string) => [...queryKeys.matches.lists(), 'public', categoryId] as const,
    upcoming: (categoryId?: string, seasonId?: string) =>
      [...queryKeys.matches.lists(), 'upcoming', categoryId, seasonId] as const,
    completed: (categoryId?: string, seasonId?: string) =>
      [...queryKeys.matches.lists(), 'completed', categoryId, seasonId] as const,
    withScores: (categoryId?: string, seasonId?: string) =>
      [...queryKeys.matches.lists(), 'withScores', categoryId, seasonId] as const,
    byMatchweek: (matchweek: number, categoryId?: string, seasonId?: string) =>
      [...queryKeys.matches.lists(), 'matchweek', matchweek, categoryId, seasonId] as const,
    byDateRange: (from: string, to: string, categoryId?: string, seasonId?: string) =>
      [...queryKeys.matches.lists(), 'dateRange', from, to, categoryId, seasonId] as const,

    // Seasonal split
    seasonal: (categoryId?: string, seasonId?: string) =>
      [...queryKeys.matches.lists(), 'seasonal', categoryId, seasonId] as const,
  },

  // Category queries
  categories: {
    all: ['categories'] as const,
    lists: () => [...queryKeys.categories.all, 'list'] as const,
    details: () => [...queryKeys.categories.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.categories.details(), id] as const,
    bySlug: (slug: string) => [...queryKeys.categories.details(), 'slug', slug] as const,
  },

  // Season queries
  seasons: {
    all: ['seasons'] as const,
    lists: () => [...queryKeys.seasons.all, 'list'] as const,
    active: () => [...queryKeys.seasons.all, 'active'] as const,
  },

  // Team queries
  teams: {
    all: ['teams'] as const,
    lists: () => [...queryKeys.teams.all, 'list'] as const,
    byCategory: (categoryId: string, seasonId?: string) =>
      [...queryKeys.teams.lists(), 'category', categoryId, seasonId] as const,
    filtered: (filters: Record<string, any>) =>
      [...queryKeys.teams.lists(), 'filtered', filters] as const,
  },

  // Standings queries
  standings: {
    all: ['standings'] as const,
    lists: () => [...queryKeys.standings.all, 'list'] as const,
    byCategory: (categoryId: string, seasonId?: string) =>
      [...queryKeys.standings.lists(), 'category', categoryId, seasonId] as const,
  },

  // Blog post queries
  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    byCategory: (categoryId: string) =>
      [...queryKeys.posts.lists(), 'category', categoryId] as const,
    published: (categoryId?: string) =>
      [...queryKeys.posts.lists(), 'published', categoryId] as const,
  },

  // User queries
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    members: () => [...queryKeys.users.all, 'members'] as const,
  },

  // Club queries
  clubs: {
    all: ['clubs'] as const,
    lists: () => [...queryKeys.clubs.all, 'list'] as const,
    details: () => [...queryKeys.clubs.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.clubs.details(), id] as const,
  },
} as const;

/**
 * Helper function to create match query keys with filters
 */
export function createMatchQueryKey(filters: {
  categoryId?: string;
  seasonId?: string;
  ownClubOnly?: boolean;
  status?: string;
  matchweek?: number;
  dateFrom?: string;
  dateTo?: string;
  includeTeamDetails?: boolean;
  includeCategory?: boolean;
  includeSeason?: boolean;
}) {
  const baseKey = queryKeys.matches.lists();
  const filterKey = Object.entries(filters)
    .filter(([_, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join(',');

  return filterKey ? [...baseKey, filterKey] : baseKey;
}

/**
 * Helper function to invalidate match-related queries
 */
export function getMatchInvalidationKeys() {
  return [queryKeys.matches.all, queryKeys.matches.lists()];
}

/**
 * Helper function to invalidate category-related queries
 */
export function getCategoryInvalidationKeys(categoryId?: string) {
  const keys: any[] = [queryKeys.categories.all, queryKeys.categories.lists()];
  if (categoryId) {
    keys.push(queryKeys.categories.detail(categoryId));
  }
  return keys;
}

/**
 * Helper function to invalidate season-related queries
 */
export function getSeasonInvalidationKeys(seasonId?: string) {
  const keys: any[] = [queryKeys.seasons.all, queryKeys.seasons.lists()];
  if (seasonId) {
    keys.push(queryKeys.seasons.active());
  }
  return keys;
}
