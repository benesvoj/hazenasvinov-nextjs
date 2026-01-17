'use client';

import {translations} from '@/lib/translations';

import {UnifiedCard} from '@/components';
import {ActionTypes} from '@/enums';
import {getCommentTypeLabel, getCommentTypeIcon, formatDateString} from '@/helpers';
import {CommentsZoneItemProps} from '@/types';

export const CommentsZoneItem = ({
  comment,
  handleEditComment,
  deleteComment,
}: CommentsZoneItemProps) => {
  const tAction = translations.action;
  const tCommon = translations.common;

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
          label: tAction.edit,
          onClick: () => handleEditComment(comment),
          variant: 'light',
          buttonType: ActionTypes.UPDATE,
          isIconOnly: true,
        },
        {
          label: tAction.delete,
          onClick: () => deleteComment(comment.id),
          variant: 'light',
          isIconOnly: true,
          color: 'danger',
          buttonType: ActionTypes.DELETE,
        },
      ]}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{comment.content}</p>
          <div className="grid gap-4 text-xs text-gray-500 mt-3 grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-6 min-w-0">
              <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tCommon.commentsZoneItem.createdBy}
              </div>
              <div className="truncate">{comment.user_email}</div>
            </div>
            <div className="md:col-span-6 min-w-0">
              <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                {tCommon.commentsZoneItem.createdAt}
              </div>
              <div className="truncate">
                {comment.created_at ? formatDateString(comment.created_at) : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </UnifiedCard>
  );
};
