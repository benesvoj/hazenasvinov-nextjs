import {
  getTodoPrioritiesOptions,
  getTodoStatusesOptions,
  getTodoCategoriesOptions,
  TodoStatuses,
} from '@/enums';
import {TodoItem} from '@/types';

import {getStatusIcon} from './todoIcons';

// Helper functions to get labels from enum options
const getPriorityLabel = (priority: TodoItem['priority']) => {
  const option = getTodoPrioritiesOptions().find((opt) => opt.value === priority);
  return option?.label || priority;
};

const getStatusLabel = (status: TodoItem['status']) => {
  const option = getTodoStatusesOptions().find((opt) => opt.value === status);
  return option?.label || status;
};

const getCategoryLabel = (category: TodoItem['category']) => {
  const option = getTodoCategoriesOptions().find((opt) => opt.value === category);
  return option?.label || category;
};

const getNextStatus = (currentStatus: TodoItem['status']): TodoItem['status'] | null => {
  switch (currentStatus) {
    case TodoStatuses.TODO:
      return TodoStatuses.IN_PROGRESS;
    case TodoStatuses.IN_PROGRESS:
      return TodoStatuses.DONE;
    case TodoStatuses.DONE:
      return null; // No next status for done
    default:
      return TodoStatuses.IN_PROGRESS;
  }
};

// Get button text and icon for status transition
const getStatusButtonInfo = (currentStatus: TodoItem['status']) => {
  const nextStatus = getNextStatus(currentStatus);
  if (!nextStatus) return null;

  switch (nextStatus) {
    case TodoStatuses.IN_PROGRESS:
      return {
        text: 'Start',
        icon: getStatusIcon(nextStatus),
        color: 'primary' as const,
      };
    case TodoStatuses.DONE:
      return {
        text: 'Complete',
        icon: getStatusIcon(nextStatus),
        color: 'success' as const,
      };
    default:
      return null;
  }
};

export {getPriorityLabel, getStatusLabel, getCategoryLabel, getNextStatus, getStatusButtonInfo};
