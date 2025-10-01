import {translations} from '@/lib/translations';

const t = translations.common.todoFilter;

export enum TodoFilter {
  ALL = 'all',
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
  HIGH_PRIORITY = 'high-priority',
}

export const TODO_FILTER_LABELS = {
  [TodoFilter.ALL]: t.all,
  [TodoFilter.TODO]: t.todo,
  [TodoFilter.IN_PROGRESS]: t.in_progress,
  [TodoFilter.DONE]: t.done,
  [TodoFilter.HIGH_PRIORITY]: t.high_priority,
} as const;

export const getTodoFilterOptions = () =>
  Object.entries(TODO_FILTER_LABELS).map(([value, label]) => ({
    value: value as TodoFilter,
    label,
  }));
