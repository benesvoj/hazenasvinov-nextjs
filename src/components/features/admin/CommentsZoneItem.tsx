import {Button, Card, CardBody} from '@heroui/react';

import {
  BugAntIcon,
  WrenchScrewdriverIcon,
  PencilIcon,
  SparklesIcon,
  TrashIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

import {UnifiedCard} from '@/components';
import {Comment} from '@/types';

interface CommentsZoneItemProps {
  comment: Comment;
  handleEditComment: (comment: Comment) => void;
  deleteComment: (id: string) => void;
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

export const CommentsZoneItem = ({
  comment,
  handleEditComment,
  deleteComment,
}: CommentsZoneItemProps) => {
  return (
    <UnifiedCard>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="flex items-center gap-1"
              title={`Type: ${getCommentTypeLabel(comment.type)}`}
            >
              {getCommentTypeIcon(comment.type)}
              <span className="text-xs text-gray-500">{getCommentTypeLabel(comment.type)}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{comment.content}</p>
          <div className="grid gap-4 text-xs text-gray-500 mt-3 grid-cols-1 md:grid-cols-12">
            <div className="md:col-span-6 min-w-0">
              <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Created by</div>
              <div className="truncate">{comment.user_email}</div>
            </div>
            <div className="md:col-span-6 min-w-0">
              <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Created</div>
              <div className="truncate">
                {new Date(comment.created_at).toLocaleDateString('en-CA', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="light"
            color="primary"
            isIconOnly
            onPress={() => handleEditComment(comment)}
          >
            <PencilIcon className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="light"
            color="danger"
            isIconOnly
            onPress={() => deleteComment(comment.id)}
          >
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </UnifiedCard>
  );
};
