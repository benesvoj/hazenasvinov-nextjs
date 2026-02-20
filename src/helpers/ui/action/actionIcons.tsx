import {
  ArrowLeftEndOnRectangleIcon,
  BookmarkIcon,
  CheckIcon,
  Cog6ToothIcon,
  EyeIcon,
  KeyIcon,
  LockClosedIcon,
  LockOpenIcon,
  PencilIcon,
  PlusCircleIcon,
  Square3Stack3DIcon,
  TrashIcon,
  WalletIcon,
  XMarkIcon,
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
  if (type === ActionTypes.BLOCKED) {
    return <LockOpenIcon className="w-4 h-4" />;
  }
  if (type === ActionTypes.UNBLOCK) {
    return <LockClosedIcon className="w-4 h-4" />;
  }
  if (type === ActionTypes.PASSWORD_RESET) {
    return <KeyIcon className="w-4 h-4" />;
  }
  return <PlusCircleIcon className="w-4 h-4" />; // Default fallback
};
