import {translations} from '@/lib/translations/index';

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
  PASSWORD_RESET = 'password-reset',
  BLOCKED = 'blocked',
  UNBLOCK = 'unblock',
}

export const ACTION_TYPE_LABELS = {
  [ActionTypes.CREATE]: translations.common.actions.add,
  [ActionTypes.READ]: translations.common.actions.read,
  [ActionTypes.UPDATE]: translations.common.actions.update,
  [ActionTypes.DELETE]: translations.common.actions.delete,
  [ActionTypes.CANCEL]: translations.common.actions.cancel,
  [ActionTypes.SAVE]: translations.common.actions.save,
  [ActionTypes.CLOSE]: translations.common.actions.close,
  [ActionTypes.APPLY]: translations.common.actions.apply,
  [ActionTypes.RESET]: translations.common.actions.reset,
  [ActionTypes.SEARCH]: translations.common.actions.search,
  [ActionTypes.FILTER]: translations.common.actions.filter,
  [ActionTypes.SORT]: translations.common.actions.sort,
  [ActionTypes.EXPORT]: translations.common.actions.export,
  [ActionTypes.IMPORT]: translations.common.actions.import,
  [ActionTypes.BULK]: translations.common.actions.bulk,
  [ActionTypes.STATUS_TRANSITION]: translations.common.actions.statusTransition,
  [ActionTypes.PAYMENT]: translations.common.actions.payment,
  [ActionTypes.PASSWORD_RESET]: translations.admin.users.table.actions.passwordReset,
  [ActionTypes.BLOCKED]: translations.admin.users.table.actions.blocked,
  [ActionTypes.UNBLOCK]: translations.admin.users.table.actions.unblock,
} as const;

export const getActionTypeOptions = () => {
  return Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => ({
    value: value as ActionTypes,
    label,
  }));
};
