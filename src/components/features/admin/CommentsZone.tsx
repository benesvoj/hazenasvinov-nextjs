'use client';

import {ChatBubbleLeftRightIcon} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {UnifiedCard, CommentsZoneItem} from '@/components';
import {ButtonTypes} from '@/enums';
import {Comment} from '@/types';

interface CommentsZoneProps {
  comments: Comment[];
  commentsLoading: boolean;
  handleAddComment: () => void;
  handleEditComment: (comment: Comment) => void;
  deleteComment: (id: string) => void;
  onAddCommentOpen: () => void;
}

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
