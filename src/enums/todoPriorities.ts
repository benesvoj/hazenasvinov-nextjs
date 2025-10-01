import {translations} from '@/lib/translations';

const t = translations.common.todoPriority;

export enum TodoPriorities {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export const TODO_PRIORITIES_LABELS: Record<TodoPriorities, string> = {
  [TodoPriorities.LOW]: t.low,
  [TodoPriorities.MEDIUM]: t.medium,
  [TodoPriorities.HIGH]: t.high,
  [TodoPriorities.URGENT]: t.urgent,
};

export const getTodoPrioritiesOptions = () =>
  Object.entries(TODO_PRIORITIES_LABELS).map(([value, label]) => ({
    value: value as TodoPriorities,
    label,
  }));
