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
  return (
    <div>
      <Card>
        <CardHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-semibold">Comments ({comments.length})</h2>
          </div>
          <Button
            size="sm"
            color="primary"
            startContent={<PlusCircleIcon className="w-4 h-4" />}
            onPress={onAddCommentOpen}
            isIconOnly
          />
        </CardHeader>
        <CardBody>
          <div className="space-y-4 max-h-96 overflow-y-auto p-2">
            {comments.map((comment) => (
              <Card key={comment.id} className="hover:shadow-md transition-shadow">
                <CardBody>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="flex items-center gap-1"
                          title={`Type: ${getCommentTypeLabel(comment.type)}`}
                        >
                          {getCommentTypeIcon(comment.type)}
                          <span className="text-xs text-gray-500">
                            {getCommentTypeLabel(comment.type)}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {comment.content}
                      </p>
                      <div className="grid gap-4 text-xs text-gray-500 mt-3 grid-cols-1 md:grid-cols-12">
                        <div className="md:col-span-6 min-w-0">
                          <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Created by
                          </div>
                          <div className="truncate">{comment.user_email}</div>
                        </div>
                        <div className="md:col-span-6 min-w-0">
                          <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Created
                          </div>
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
                </CardBody>
              </Card>
            ))}
            {comments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No comments yet. Add your first comment!
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
