import {
  BookmarkIcon,
  CheckIcon,
  Cog6ToothIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ArrowLeftEndOnRectangleIcon,
  PlusCircleIcon,
  Square3Stack3DIcon,
  WalletIcon,
} from '@heroicons/react/24/solid';

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
  if (type === ActionTypes.BULK) {
    return <Square3Stack3DIcon className="w-4 h-4" />;
  }
  if (type === ActionTypes.IMPORT) {
    return <ArrowLeftEndOnRectangleIcon className="w-4 h-4" />;
  }
  if (type === ActionTypes.PAYMENT) {
    return <WalletIcon className="w-4 h-4" />;
  }
  return <PlusCircleIcon className="w-4 h-4" />; // Default fallback
};
