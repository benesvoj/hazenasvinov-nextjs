'use client';

import {Card, CardHeader, CardBody, Button} from '@heroui/react';

import {PlusCircleIcon} from '@heroicons/react/16/solid';
import {
  ChatBubbleLeftRightIcon,
  InformationCircleIcon,
  WrenchScrewdriverIcon,
  BugAntIcon,
  SparklesIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import {translations} from '@/lib/translations';

import {UnifiedCard, CommentsZoneItem} from '@/components';
import {Comment} from '@/types';

interface CommentsZoneProps {
  comments: Comment[];
  commentsLoading: boolean;
  handleAddComment: () => void;
  handleEditComment: (comment: Comment) => void;
  deleteComment: (id: string) => void;
  onAddCommentOpen: () => void;
}

const getCommentTypeLabel = (type: Comment['type']) => {
  switch (type) {
    case 'general':
      return 'General';
    case 'bug':
      return 'Bug Report';
    case 'feature':
      return 'Feature Request';
    case 'improvement':
      return 'Improvement';
    default:
      return 'General';
  }
};

const getCommentTypeIcon = (type: Comment['type']) => {
  switch (type) {
    case 'general':
      return <InformationCircleIcon className="w-4 h-4" />;
    case 'bug':
      return <BugAntIcon className="w-4 h-4" />;
    case 'feature':
      return <SparklesIcon className="w-4 h-4" />;
    case 'improvement':
      return <WrenchScrewdriverIcon className="w-4 h-4" />;
    default:
      return <InformationCircleIcon className="w-4 h-4" />;
  }
};

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
      action={{
        label: t.commentList.addComment,
        onClick: onAddCommentOpen,
        variant: 'solid',
      }}
    >
      {comments.map((comment) => (
        <CommentsZoneItem
          key={comment.id}
          comment={comment}
          handleEditComment={handleEditComment}
          deleteComment={deleteComment}
        />
      ))}
    </UnifiedCard>
  );
}
