'use client';

import {useCallback, useState} from 'react';

import {isEmpty} from '@/utils/arrayHelper';

import {MatchStatus} from '@/enums';
import {useFilteredTeams} from '@/hooks';
import {AddMatchFormData, Category, EditMatchFormData, Match} from '@/types';
import {
  buildMatchInsertData,
  buildMatchUpdateData,
  isNilOrZero,
  validateAddMatchForm,
  validateEditMatchForm,
  validateResultData,
  validateSeasonNotClosed,
} from '@/utils';

const INITIAL_FORM_DATA: AddMatchFormData = {
  date: '',
  time: '',
  home_team_id: '',
  away_team_id: '',
  venue: '',
  category_id: '',
  season_id: '',
  matchweek: undefined,
  match_number: undefined,
  video_ids: [],
};

const INITIAL_EDIT_DATA: EditMatchFormData = {
  date: '',
  time: '',
  home_team_id: '',
  away_team_id: '',
  venue: '',
  home_score: 0,
  away_score: 0,
  home_score_halftime: 0,
  away_score_halftime: 0,
  status: MatchStatus.COMPLETED,
  matchweek: 0,
  match_number: 0,
  category_id: '',
  video_ids: [],
};

const INITIAL_RESULT_DATA = {
  home_score: 0,
  away_score: 0,
  home_score_halftime: 0,
  away_score_halftime: 0,
};

interface UseMatchesCrudActionsProps {
  isSeasonClosed: boolean;
  selectedCategory: string;
  selectedSeasonId: string;
  categories: Category[];
  modal: {
    addMatch: {onClose: () => void};
    addResult: {onClose: () => void};
    editMatch: {onOpen: () => void; onClose: () => void};
  };
  deleteConfirm: {
    selectedItem: Match | null;
    closeAndClear: () => void;
  };
  setError: (err: string) => void;
  createMatch: (data: any) => Promise<boolean>;
  updateMatch: (id: string, data: any, original: Match) => Promise<boolean>;
  updateMatchResult: (id: string, data: any) => Promise<boolean>;
  deleteMatchFn: (id: string) => Promise<boolean>;
}

export function useMatchesCrudActions({
  isSeasonClosed,
  selectedCategory,
  selectedSeasonId,
  categories,
  modal,
  deleteConfirm,
  setError,
  createMatch,
  updateMatch,
  updateMatchResult,
  deleteMatchFn,
}: UseMatchesCrudActionsProps) {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [formData, setFormData] = useState<AddMatchFormData>(INITIAL_FORM_DATA);
  const [editData, setEditData] = useState<EditMatchFormData>(INITIAL_EDIT_DATA);
  const [resultData, setResultData] = useState(INITIAL_RESULT_DATA);

  const {filteredTeams, fetchFilteredTeams} = useFilteredTeams(selectedCategory, selectedSeasonId);

  const handleAddMatch = useCallback(async () => {
    const seasonValidation = validateSeasonNotClosed(isSeasonClosed, 'přidat zápas');
    if (!seasonValidation.valid) {
      setError(seasonValidation.error!);
      return;
    }

    const validation = validateAddMatchForm(formData);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    const insertData = buildMatchInsertData(
      formData,
      selectedCategory,
      selectedSeasonId,
      categories
    );
    const success = await createMatch(insertData);

    if (success) {
      modal.addMatch.onClose();
      setFormData(INITIAL_FORM_DATA);
      setError('');
    }
  }, [
    isSeasonClosed,
    formData,
    selectedCategory,
    selectedSeasonId,
    categories,
    createMatch,
    modal,
    setError,
  ]);

  const handleUpdateResult = useCallback(async () => {
    const seasonValidation = validateSeasonNotClosed(isSeasonClosed, 'aktualizovat výsledek');
    if (!seasonValidation.valid) {
      setError(seasonValidation.error!);
      return;
    }
    if (!selectedMatch) return;

    const validation = validateResultData(resultData);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    const success = await updateMatchResult(selectedMatch.id, resultData);
    if (success) {
      modal.addResult.onClose();
      setResultData(INITIAL_RESULT_DATA);
      setSelectedMatch(null);
      setError('');
    }
  }, [isSeasonClosed, selectedMatch, resultData, updateMatchResult, modal, setError]);

  const handleEditMatch = useCallback(
    (match: Match) => {
      if (!match) return;
      setSelectedMatch(match);
      setEditData({
        date: match.date,
        time: match.time,
        home_team_id: match.home_team_id,
        away_team_id: match.away_team_id,
        venue: match.venue,
        home_score: match.home_score ?? 0,
        away_score: match.away_score ?? 0,
        home_score_halftime: match.home_score_halftime ?? 0,
        away_score_halftime: match.away_score_halftime ?? 0,
        status: match.status,
        matchweek: isNilOrZero(match.matchweek) ? 0 : match.matchweek,
        match_number: match.match_number ? match.match_number : 0,
        category_id: match.category_id,
      });
      if (match.category_id && selectedSeasonId && isEmpty(filteredTeams)) {
        fetchFilteredTeams(match.category_id, selectedSeasonId);
      }
      modal.editMatch.onOpen();
    },
    [selectedSeasonId, filteredTeams, fetchFilteredTeams, modal]
  );

  const handleUpdateMatch = useCallback(async () => {
    const seasonValidation = validateSeasonNotClosed(isSeasonClosed, 'aktualizovat zápas');
    if (!seasonValidation.valid) {
      setError(seasonValidation.error!);
      return;
    }
    if (!selectedMatch) return;

    const validation = validateEditMatchForm(editData);
    if (!validation.valid) {
      setError(validation.error!);
      return;
    }

    const updateData = buildMatchUpdateData(editData);
    const success = await updateMatch(selectedMatch.id, updateData, selectedMatch);
    if (success) {
      modal.editMatch.onClose();
      setEditData(INITIAL_EDIT_DATA);
      setSelectedMatch(null);
      setError('');
    }
  }, [isSeasonClosed, selectedMatch, editData, updateMatch, modal, setError]);

  const handleDeleteMatch = useCallback(async () => {
    if (!deleteConfirm.selectedItem) return;
    const seasonValidation = validateSeasonNotClosed(isSeasonClosed, 'smazat zápas');
    if (!seasonValidation.valid) {
      setError(seasonValidation.error!);
      return;
    }

    const success = await deleteMatchFn(deleteConfirm.selectedItem.id);
    if (success) {
      setError('');
      deleteConfirm.closeAndClear();
    }
  }, [deleteConfirm, isSeasonClosed, deleteMatchFn, setError]);

  return {
    selectedMatch,
    setSelectedMatch,
    formData,
    setFormData,
    editData,
    setEditData,
    resultData,
    setResultData,
    filteredTeams,
    handleAddMatch,
    handleUpdateResult,
    handleEditMatch,
    handleUpdateMatch,
    handleDeleteMatch,
  };
}
