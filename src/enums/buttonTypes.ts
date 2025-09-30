import {translations} from '@/lib/translations';

const t = translations.button;

export enum ButtonTypes {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  CANCEL = 'cancel',
  SAVE = 'save',
  CLOSE = 'close',
  APPLY = 'apply',
  RESET = 'reset',
  SEARCH = 'search',
  FILTER = 'filter',
  SORT = 'sort',
  EXPORT = 'export',
  STATUS_TRANSITION = 'status-transition',
}

export const BUTTON_TYPE_LABELS = {
  [ButtonTypes.CREATE]: t.add,
  [ButtonTypes.READ]: t.read,
  [ButtonTypes.UPDATE]: t.update,
  [ButtonTypes.DELETE]: t.delete,
  [ButtonTypes.CANCEL]: t.cancel,
  [ButtonTypes.SAVE]: t.save,
  [ButtonTypes.CLOSE]: t.close,
  [ButtonTypes.APPLY]: t.apply,
  [ButtonTypes.RESET]: t.reset,
  [ButtonTypes.SEARCH]: t.search,
  [ButtonTypes.FILTER]: t.filter,
  [ButtonTypes.SORT]: t.sort,
  [ButtonTypes.EXPORT]: t.export,
  [ButtonTypes.STATUS_TRANSITION]: t.statusTransition,
} as const;

export const getButtonTypeOptions = () => {
  return Object.entries(BUTTON_TYPE_LABELS).map(([value, label]) => ({
    value: value as ButtonTypes,
    label,
  }));
};
