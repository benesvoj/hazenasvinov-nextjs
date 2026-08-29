'use client';

import {useModals, useModalWithItem} from '@/hooks/shared/useModals';

import {Match} from '@/types';

export function useMatchesModals() {
  const modal = useModals(
    'addMatch',
    'addResult',
    'editMatch',
    'bulkUpdate',
    'lineup',
    'excelImport',
    'matchProcess',
    'deleteAllConfirm',
    'pointDeductions'
  );
  const deleteConfirm = useModalWithItem<Match>();
  const matchActions = useModalWithItem<Match>();

  return {modal, deleteConfirm, matchActions};
}
