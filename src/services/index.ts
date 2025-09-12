export * from './matchQueries';

// Performance-optimized exports
export {
  getMatchesBasicOptimized,
  getMatchesWithTeamsOptimized,
  getMatchesSeasonalOptimized,
  getOwnClubMatchesOptimized,
  getMatchesBatchOptimized,
  preloadMatchData,
  invalidateMatchCache,
  invalidateMatchCacheAll,
  matchCache,
  teamCache,
  categoryCache,
  cacheKeys,
} from './optimizedMatchQueries';
