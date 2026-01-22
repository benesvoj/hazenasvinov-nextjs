export {
  createMatch,
  updateMatch,
  deleteMatch,
  bulkUpdateMatchweek,
  deleteMatchesBySeason,
  updateMatchResult,
} from './mutations';

export {DB_TABLE, ENTITY} from './constants';

export type {
  MatchInsertData,
  MatchUpdateData,
  MatchResultData,
  BulkMatchweekUpdateData,
} from './types';
