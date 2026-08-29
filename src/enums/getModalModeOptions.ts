import {ModalMode} from '@/enums/modalMode';

import {translations} from '@/lib/translations';

export function modalModeLabels() {
  const t = translations.components.enums.modalMode;
  return {
    [ModalMode.ADD]: t.add,
    [ModalMode.EDIT]: t.edit,
  };
}

export const getModalModeOptions = () => {
  const labels = modalModeLabels();

  return Object.entries(labels).map(([value, label]) => ({
    value: value as ModalMode,
    label,
  }));
};
