import {PlusCircleIcon} from '@heroicons/react/16/solid';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  Cog6ToothIcon,
  BookmarkIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

import {ActionTypes} from '@/enums';

// Helper function to get default icon for common actions
export const getDefaultActionIcon = (type: ActionTypes) => {
  if (type === ActionTypes.CREATE) {
    return <PlusCircleIcon className="w-4 h-4" />;
  }
  if (type === ActionTypes.UPDATE) {
    return <PencilIcon className="w-4 h-4" />;
  }
  if (type === ActionTypes.DELETE) {
    return <TrashIcon className="w-4 h-4" />;
  }
  if (type === ActionTypes.READ) {
    return <EyeIcon className="w-4 h-4" />;
  }
  if (type === ActionTypes.CANCEL) {
    return <Cog6ToothIcon className="w-4 h-4" />;
  }
  if (type === ActionTypes.SAVE) {
    return <BookmarkIcon className="w-4 h-4" />;
  }
  if (type === ActionTypes.CLOSE) {
    return <XMarkIcon className="w-4 h-4" />;
  }
  if (type === ActionTypes.APPLY) {
    return <CheckIcon className="w-4 h-4" />;
  }
  return <PlusCircleIcon className="w-4 h-4" />; // Default fallback
};
