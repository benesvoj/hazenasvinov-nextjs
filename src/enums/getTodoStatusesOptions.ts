import {TodoStatuses} from '@/enums/todoStatuses';

import {translations} from '@/lib/translations';

export function todoStatusesLabels() {
  const t = translations.todos.enums.todoStatus;

  return {
    [TodoStatuses.TODO]: t.todo,
    [TodoStatuses.IN_PROGRESS]: t.in_progress,
    [TodoStatuses.DONE]: t.done,
  };
}

export const getTodoStatusesOptions = () => {
  const labels = todoStatusesLabels();

  return Object.entries(labels).map(([value, label]) => ({
    value: value as TodoStatuses,
    label,
  }));
};
