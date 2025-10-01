import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FireIcon,
  FlagIcon,
  BoltIcon,
  SparklesIcon,
  BugAntIcon,
  WrenchScrewdriverIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

import {TodoCategories, TodoPriorities, TodoStatuses} from '@/enums';
import {TodoItem} from '@/types';

export const getStatusIcon = (status: TodoItem['status']) => {
  switch (status) {
    case TodoStatuses.DONE:
      return <CheckCircleIcon className="w-4 h-4" />;
    case TodoStatuses.IN_PROGRESS:
      return <ClockIcon className="w-4 h-4" />;
    case TodoStatuses.TODO:
      return <ExclamationTriangleIcon className="w-4 h-4" />;
    default:
      return <ExclamationTriangleIcon className="w-4 h-4" />;
  }
};

export const getPriorityIcon = (priority: TodoItem['priority']) => {
  switch (priority) {
    case TodoPriorities.URGENT:
      return <FireIcon className="w-4 h-4" />;
    case TodoPriorities.HIGH:
      return <FlagIcon className="w-4 h-4" />;
    case TodoPriorities.MEDIUM:
      return <BoltIcon className="w-4 h-4" />;
    case TodoPriorities.LOW:
      return <ExclamationTriangleIcon className="w-4 h-4" />;
    default:
      return <BoltIcon className="w-4 h-4" />;
  }
};

export const getCategoryIcon = (category: TodoItem['category']) => {
  switch (category) {
    case TodoCategories.FEATURE:
      return <SparklesIcon className="w-4 h-4" />;
    case TodoCategories.BUG:
      return <BugAntIcon className="w-4 h-4" />;
    case TodoCategories.IMPROVEMENT:
      return <WrenchScrewdriverIcon className="w-4 h-4" />;
    case TodoCategories.TECHNICAL:
      return <Cog6ToothIcon className="w-4 h-4" />;
    default:
      return <WrenchScrewdriverIcon className="w-4 h-4" />;
  }
};
