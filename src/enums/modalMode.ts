import {translations} from '@/lib/translations';

const t = translations.common.modalMode;

export enum ModalMode {
  ADD = 'add',
  EDIT = 'edit',
}

export const MODAL_MODE_LABELS: Record<ModalMode, string> = {
  [ModalMode.ADD]: t.add,
  [ModalMode.EDIT]: t.edit,
};

export const getModalModeOptions = () =>
  Object.entries(MODAL_MODE_LABELS).map(([value, label]) => ({
    value: value as ModalMode,
    label,
  }));
