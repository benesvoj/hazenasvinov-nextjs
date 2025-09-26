import {translations} from '@/lib/translations';

const t = translations.lineupErrorType;
/**
 * @file lineupErrorType.ts
 * @description Error types for robust error handling
 */
export enum LineupErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export const LINEUP_ERROR_TYPE_LABELS: Record<LineupErrorType, string> = {
  [LineupErrorType.VALIDATION_ERROR]: t.validationError,
  [LineupErrorType.DATABASE_ERROR]: t.databaseError,
  [LineupErrorType.NETWORK_ERROR]: t.networkError,
  [LineupErrorType.UNKNOWN_ERROR]: t.unknownError,
};

export const getLineupErrorTypeOptions = () =>
  Object.entries(LINEUP_ERROR_TYPE_LABELS).map(([value, label]) => ({
    value: value as LineupErrorType,
    label,
  }));
