import {translations} from '@/lib/translations';

const t = translations.action;

export enum ActionTypes {
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
  IMPORT = 'import',
  BULK = 'bulk',
  STATUS_TRANSITION = 'status-transition',
  PAYMENT = 'payment',
}

export const ACTION_TYPE_LABELS = {
  [ActionTypes.CREATE]: t.add,
  [ActionTypes.READ]: t.read,
  [ActionTypes.UPDATE]: t.update,
  [ActionTypes.DELETE]: t.delete,
  [ActionTypes.CANCEL]: t.cancel,
  [ActionTypes.SAVE]: t.save,
  [ActionTypes.CLOSE]: t.close,
  [ActionTypes.APPLY]: t.apply,
  [ActionTypes.RESET]: t.reset,
  [ActionTypes.SEARCH]: t.search,
  [ActionTypes.FILTER]: t.filter,
  [ActionTypes.SORT]: t.sort,
  [ActionTypes.EXPORT]: t.export,
  [ActionTypes.IMPORT]: t.import,
  [ActionTypes.BULK]: t.bulk,
  [ActionTypes.STATUS_TRANSITION]: t.statusTransition,
  [ActionTypes.PAYMENT]: t.payment,
} as const;

export const getActionTypeOptions = () => {
  return Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => ({
    value: value as ActionTypes,
    label,
  }));
};
