import {translations} from '@/lib';

const t = translations.common.todoStatus;

export enum TodoStatuses {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
}

export const TODO_STATUSES_LABELS: Record<TodoStatuses, string> = {
  [TodoStatuses.TODO]: t.todo,
  [TodoStatuses.IN_PROGRESS]: t.in_progress,
  [TodoStatuses.DONE]: t.done,
};

export const getTodoStatusesOptions = () =>
  Object.entries(TODO_STATUSES_LABELS).map(([value, label]) => ({
    value: value as TodoStatuses,
    label,
  }));
