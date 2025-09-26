import {translations} from '@/lib/translations';

const t = translations.lineupErrorType;
/**
 * @file lineupErrorType.ts
 * @description Error types for robust error handling
 */
export enum LineupErrorType {
  VALIDATION = 'VALIDATION',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN',
}

export const LINEUP_ERROR_TYPE_LABELS: Record<LineupErrorType, string> = {
  [LineupErrorType.VALIDATION]: t.validationError,
  [LineupErrorType.DATABASE]: t.databaseError,
  [LineupErrorType.NETWORK]: t.networkError,
  [LineupErrorType.UNKNOWN]: t.unknownError,
};

export const getLineupErrorTypeOptions = () =>
  Object.entries(LINEUP_ERROR_TYPE_LABELS).map(([value, label]) => ({
    value: value as LineupErrorType,
    label,
  }));
