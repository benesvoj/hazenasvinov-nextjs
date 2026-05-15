'use client';

import {useCallback, useState} from 'react';

import {translations} from '@/lib/translations';

import {hasItems} from '@/utils/arrayHelper';

import {showToast} from '@/components';
import {useExcelImport} from '@/hooks';
import {Match} from '@/types';
import {validateSeasonNotClosed} from '@/utils';

const INITIAL_BULK_DATA = {
  categoryId: '',
  matchweek: '',
  action: 'set' as 'set' | 'remove',
};

interface UseMatchesBulkActionsProps {
  isSeasonClosed: boolean;
  selectedSeasonId: string;
  matches: Match[];
  modal: {
    bulkUpdate: {onClose: () => void};
    excelImport: {onClose: () => void};
    deleteAllConfirm: {onClose: () => void};
  };
  setError: (err: string) => void;
  setSelectedCategory: (id: string) => void;
  refreshStandings: () => Promise<void>;
  bulkUpdateMatchweekFn: (data: typeof INITIAL_BULK_DATA, matches: Match[]) => Promise<boolean>;
  deleteAllMatchesBySeasonFn: (seasonId: string) => Promise<boolean>;
}

export function useMatchesBulkActions({
  isSeasonClosed,
  selectedSeasonId,
  matches,
  modal,
  setError,
  setSelectedCategory,
  refreshStandings,
  bulkUpdateMatchweekFn,
  deleteAllMatchesBySeasonFn,
}: UseMatchesBulkActionsProps) {
  const [bulkUpdateData, setBulkUpdateData] = useState(INITIAL_BULK_DATA);

  const {importMatches} = useExcelImport();

  const handleBulkUpdateMatchweek = useCallback(async () => {
    if (!bulkUpdateData.categoryId) {
      setError('Prosím vyberte kategorii');
      return;
    }
    if (bulkUpdateData.action === 'set' && !bulkUpdateData.matchweek) {
      setError('Prosím vyberte kolo pro nastavení');
      return;
    }

    const success = await bulkUpdateMatchweekFn(bulkUpdateData, matches);
    if (success) {
      setError('');
      modal.bulkUpdate.onClose();
      setBulkUpdateData(INITIAL_BULK_DATA);
    } else {
      setError('Chyba při hromadné aktualizaci');
    }
  }, [bulkUpdateData, matches, bulkUpdateMatchweekFn, modal, setError]);

  const handleDeleteAllMatches = useCallback(async () => {
    if (!selectedSeasonId) return;
    const seasonValidation = validateSeasonNotClosed(isSeasonClosed, 'smazat zápasy');
    if (!seasonValidation.valid) {
      setError(seasonValidation.error!);
      return;
    }

    const success = await deleteAllMatchesBySeasonFn(selectedSeasonId);
    if (success) {
      setError('');
      modal.deleteAllConfirm.onClose();
      setSelectedCategory('');
    }
  }, [
    selectedSeasonId,
    isSeasonClosed,
    deleteAllMatchesBySeasonFn,
    modal,
    setError,
    setSelectedCategory,
  ]);

  const handleExcelImport = useCallback(
    async (importedMatches: any[]) => {
      if (!selectedSeasonId) {
        setError('Vyberte prosím sezónu před importem.');
        return;
      }

      try {
        const result = await importMatches(importedMatches, selectedSeasonId);
        if (result.success > 0) {
          await refreshStandings();
          setError('');
          showToast.success(translations.matches.toasts.matchSuccessImport);
        }
        if (hasItems(result.errors)) {
          setError(
            `Import dokončen s chybami. Úspěšně: ${result.success}, Selhalo: ${result.failed}. Zkontrolujte konzoli pro detaily.`
          );
        }
      } catch (err) {
        setError(`Import selhal: ${err instanceof Error ? err.message : 'Neznámá chyba'}`);
      }
    },
    [selectedSeasonId, importMatches, refreshStandings, setError]
  );

  return {
    bulkUpdateData,
    setBulkUpdateData,
    handleBulkUpdateMatchweek,
    handleDeleteAllMatches,
    handleExcelImport,
  };
}
