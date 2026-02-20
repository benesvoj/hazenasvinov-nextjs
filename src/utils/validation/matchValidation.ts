import {translations} from '@/lib/translations/index';

import {AddMatchFormData, EditMatchFormData} from '@/types';

export interface ValidationMatchResult {
  valid: boolean;
  error?: string;
  field?: string;
}

/**
 * Validates the add match form data
 */
export function validateAddMatchForm(formData: AddMatchFormData): ValidationMatchResult {
  if (!formData.date) {
    return {
      valid: false,
      error: translations.matches.validationRules.matchDateRequired,
      field: 'date',
    };
  }

  if (!formData.time) {
    return {
      valid: false,
      error: translations.matches.validationRules.matchTimeRequired,
      field: 'time',
    };
  }

  if (!formData.home_team_id) {
    return {
      valid: false,
      error: translations.matches.validationRules.homeTeamRequired,
      field: 'home_team_id',
    };
  }

  if (!formData.away_team_id) {
    return {
      valid: false,
      error: translations.matches.validationRules.awayTeamRequired,
      field: 'away_team_id',
    };
  }

  if (!formData.venue) {
    return {
      valid: false,
      error: translations.matches.validationRules.venueRequired,
      field: 'venue',
    };
  }

  if (formData.home_team_id === formData.away_team_id) {
    return {
      valid: false,
      error: translations.matches.validationRules.differentTeams,
      field: 'away_team_id',
    };
  }

  return {valid: true};
}

/**
 * Validates the edit match form data
 */
export function validateEditMatchForm(formData: EditMatchFormData): ValidationMatchResult {
  if (!formData.date) {
    return {valid: false, error: translations.matches.toasts.mandatoryFieldsMissing, field: 'date'};
  }

  if (!formData.time) {
    return {valid: false, error: translations.matches.toasts.mandatoryFieldsMissing, field: 'time'};
  }

  if (!formData.venue) {
    return {
      valid: false,
      error: translations.matches.toasts.mandatoryFieldsMissing,
      field: 'venue',
    };
  }

  if (!formData.home_team_id || !formData.away_team_id) {
    return {valid: false, error: translations.matches.toasts.selectBothTeams, field: 'teams'};
  }

  if (formData.home_team_id === formData.away_team_id) {
    return {
      valid: false,
      error: translations.matches.toasts.selectDifferentTeams,
      field: 'away_team_id',
    };
  }

  return {valid: true};
}

/**
 * Validates match result data
 */
export interface MatchResultData {
  home_score: number;
  away_score: number;
  home_score_halftime: number;
  away_score_halftime: number;
}

export function validateResultData(data: MatchResultData): ValidationMatchResult {
  if (data.home_score === null || data.home_score === undefined) {
    return {
      valid: false,
      error: translations.matches.validationRules.homeMatchResultRequired,
      field: 'home_score',
    };
  }

  if (data.away_score === null || data.away_score === undefined) {
    return {
      valid: false,
      error: translations.matches.validationRules.awayMatchResultRequired,
      field: 'away_score',
    };
  }

  if (data.home_score < 0 || data.away_score < 0) {
    return {
      valid: false,
      error: translations.matches.validationRules.negativeMatchResult,
      field: 'score',
    };
  }

  return {valid: true};
}

/**
 * Validates bulk update data
 */
export interface BulkUpdateValidationData {
  categoryId: string;
  matchweek: string;
  action: 'set' | 'remove';
}

export function validateBulkUpdateData(data: BulkUpdateValidationData): ValidationMatchResult {
  if (!data.categoryId) {
    return {
      valid: false,
      error: translations.matches.validationRules.categoryRequired,
      field: 'categoryId',
    };
  }

  if (data.action === 'set' && !data.matchweek) {
    return {
      valid: false,
      error: translations.matches.validationRules.matchweekRequired,
      field: 'matchweek',
    };
  }

  return {valid: true};
}

/**
 * Validates season is not closed
 */
export function validateSeasonNotClosed(isClosed: boolean, action: string): ValidationMatchResult {
  if (isClosed) {
    return {
      valid: false,
      error: `Nelze ${action} v uzavřené sezóně`,
    };
  }
  return {valid: true};
}
