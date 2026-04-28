import {TodoPriorities} from '@/enums/todoPriorities';

import {translations} from '@/lib/translations';

export function todoPrioritiesLabels() {
  const t = translations.todos.enums.todoPriority;
  return {
    [TodoPriorities.LOW]: t.low,
    [TodoPriorities.MEDIUM]: t.medium,
    [TodoPriorities.HIGH]: t.high,
    [TodoPriorities.URGENT]: t.urgent,
  };
}

export const getTodoPrioritiesOptions = () => {
  const labels = todoPrioritiesLabels();

  return Object.entries(labels).map(([value, label]) => ({
    value: value as TodoPriorities,
    label,
  }));
};
