import {
  InformationCircleIcon,
  BugAntIcon,
  SparklesIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

import {CommentTypes} from '@/enums';

export const getCommentTypeIcon = (type: CommentTypes) => {
  switch (type) {
    case CommentTypes.GENERAL:
      return <InformationCircleIcon className="w-4 h-4" />;
    case CommentTypes.BUG:
      return <BugAntIcon className="w-4 h-4" />;
    case CommentTypes.FEATURE:
      return <SparklesIcon className="w-4 h-4" />;
    case CommentTypes.IMPROVEMENT:
      return <WrenchScrewdriverIcon className="w-4 h-4" />;
    default:
      return <InformationCircleIcon className="w-4 h-4" />;
  }
};
