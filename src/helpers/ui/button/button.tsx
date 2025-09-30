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

import {ButtonTypes} from '@/enums';

// Helper function to get default icon for common actions
export const getDefaultActionIcon = (type: ButtonTypes) => {
  if (type === ButtonTypes.CREATE) {
    return <PlusCircleIcon className="w-4 h-4" />;
  }
  if (type === ButtonTypes.UPDATE) {
    return <PencilIcon className="w-4 h-4" />;
  }
  if (type === ButtonTypes.DELETE) {
    return <TrashIcon className="w-4 h-4" />;
  }
  if (type === ButtonTypes.READ) {
    return <EyeIcon className="w-4 h-4" />;
  }
  if (type === ButtonTypes.CANCEL) {
    return <Cog6ToothIcon className="w-4 h-4" />;
  }
  if (type === ButtonTypes.SAVE) {
    return <BookmarkIcon className="w-4 h-4" />;
  }
  if (type === ButtonTypes.CLOSE) {
    return <XMarkIcon className="w-4 h-4" />;
  }
  if (type === ButtonTypes.APPLY) {
    return <CheckIcon className="w-4 h-4" />;
  }
  return <PlusCircleIcon className="w-4 h-4" />; // Default fallback
};
