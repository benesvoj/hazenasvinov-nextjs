'use client';

import {ChatBubbleLeftRightIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {UnifiedCard, CommentsZoneItem} from '@/components';
import {ButtonTypes} from '@/enums';
import {CommentsZoneProps} from '@/types';

export default function CommentsZone({
  comments,
  commentsLoading,
  handleAddComment,
  handleEditComment,
  onAddCommentOpen,
  deleteComment,
}: CommentsZoneProps) {
  const t = translations.common;

  const commentCardTitle = (
    <>
      <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-500" />
      {t.commentList.title} ({comments.length})
    </>
  );

  return (
    <UnifiedCard
      title={commentCardTitle}
      onPress={onAddCommentOpen}
      isLoading={commentsLoading}
      actions={[
        {
          label: t.commentList.addComment,
          onClick: onAddCommentOpen,
          variant: 'solid',
          buttonType: ButtonTypes.CREATE,
        },
      ]}
    >
      <div className="flex flex-col gap-4">
        {comments.map((comment) => (
          <CommentsZoneItem
            key={comment.id}
            comment={comment}
            handleEditComment={handleEditComment}
            deleteComment={deleteComment}
          />
        ))}
      </div>
    </UnifiedCard>
  );
}
