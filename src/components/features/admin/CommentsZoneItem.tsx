import {Button} from '@heroui/react';

import {PencilIcon, TrashIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {UnifiedCard} from '@/components';
import {ButtonTypes} from '@/enums';
import {getCommentTypeLabel, getCommentTypeIcon, formatDateString} from '@/helpers';
import {CommentsZoneItemProps} from '@/types';

export const CommentsZoneItem = ({
  comment,
  handleEditComment,
  deleteComment,
}: CommentsZoneItemProps) => {
  const t = translations;

  const commentTitle = () => (
    <>
      {getCommentTypeIcon(comment.type)}
      <span className="text-xs text-gray-500">{getCommentTypeLabel(comment.type)}</span>
    </>
  );

  return (
    <UnifiedCard
      isPressable={false}
      title={commentTitle()}
      actions={[
        {
          label: t.button.edit,
          onClick: () => handleEditComment(comment),
          variant: 'light',
          buttonType: ButtonTypes.UPDATE,
          isIconOnly: true,
        },
        {
          label: t.button.delete,
          onClick: () => deleteComment(comment.id),
          variant: 'light',
          isIconOnly: true,
          color: 'danger',
          buttonType: ButtonTypes.DELETE,
        },
      ]}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{comment.content}</p>
          <div className="grid gap-4 text-xs text-gray-500 mt-3 grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-6 min-w-0">
              <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.common.commentsZoneItem.createdBy}
              </div>
              <div className="truncate">{comment.user_email}</div>
            </div>
            <div className="md:col-span-6 min-w-0">
              <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t.common.commentsZoneItem.createdAt}
              </div>
              <div className="truncate">{formatDateString(comment.created_at)}</div>
            </div>
          </div>
        </div>
      </div>
    </UnifiedCard>
  );
};
