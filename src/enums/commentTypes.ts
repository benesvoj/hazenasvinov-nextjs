import {translations} from '@/lib/translations';

const t = translations.common.commentTypes;

export enum CommentTypes {
  GENERAL = 'general',
  BUG = 'bug',
  FEATURE = 'feature',
  IMPROVEMENT = 'improvement',
}

export const COMMENT_TYPES_LABELS: Record<CommentTypes, string> = {
  [CommentTypes.GENERAL]: t.general,
  [CommentTypes.BUG]: t.bug,
  [CommentTypes.FEATURE]: t.feature,
  [CommentTypes.IMPROVEMENT]: t.improvement,
};

export const getCommentTypesOptions = () => {
  return Object.entries(COMMENT_TYPES_LABELS).map(([value, label]) => ({
    value: value as CommentTypes,
    label,
  }));
};
