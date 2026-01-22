import {getCategoryInfo} from '@/helpers/getCategoryInfo';

import {MatchStatus} from '@/enums';
import {MatchInsertData, MatchUpdateData} from '@/queries/matches';
import {AddMatchFormData, EditMatchFormData, Category} from '@/types';
import {isNotNilOrEmpty, isValidPositiveNumber, isNilOrZero} from '@/utils';
/**
 * Builds insert data from add match form
 */
export function buildMatchInsertData(
  formData: AddMatchFormData,
  categoryId: string,
  seasonId: string,
  categories: Category[]
): MatchInsertData {
  const insertData: MatchInsertData = {
    category_id: categoryId,
    season_id: seasonId,
    date: formData.date,
    time: formData.time,
    home_team_id: formData.home_team_id,
    away_team_id: formData.away_team_id,
    venue: formData.venue || '',
    competition: getCategoryInfo(categoryId, categories).competition,
    is_home: true,
    status: MatchStatus.UPCOMING,
    matchweek: null,
    match_number: null,
  };

  // Handle matchweek
  if (isValidPositiveNumber(formData.matchweek)) {
    insertData.matchweek = formData.matchweek;
  }

  // Handle match_number
  if (isValidPositiveNumber(formData.match_number)) {
    insertData.match_number = formData.match_number;
  }

  return insertData;
}

/**
 * Builds update data from edit match form
 */
export function buildMatchUpdateData(formData: EditMatchFormData): MatchUpdateData {
  const updateData: MatchUpdateData = {
    date: formData.date,
    time: formData.time,
    home_team_id: formData.home_team_id,
    away_team_id: formData.away_team_id,
    venue: formData.venue,
    status: formData.status,
    matchweek: null,
    match_number: 0,
  };

  // Handle matchweek
  if (isNilOrZero(formData.matchweek)) {
    updateData.matchweek = null;
  } else if (formData.matchweek) {
    updateData.matchweek = parseInt(formData.matchweek.toString());
  }

  // Handle match_number
  if (isValidPositiveNumber(formData.match_number)) {
    updateData.match_number = formData.match_number;
  }

  // Handle scores (only if provided)
  if (isNotNilOrEmpty(formData.home_score) && isNotNilOrEmpty(formData.away_score)) {
    updateData.home_score = formData.home_score;
    updateData.away_score = formData.away_score;
  }

  if (
    isNotNilOrEmpty(formData.home_score_halftime) &&
    isNotNilOrEmpty(formData.away_score_halftime)
  ) {
    updateData.home_score_halftime = formData.home_score_halftime;
    updateData.away_score_halftime = formData.away_score_halftime;
  }

  // Handle video_ids (currently missing in original code!)
  if (formData.video_ids) {
    updateData.video_ids = formData.video_ids;
  }

  return updateData;
}
