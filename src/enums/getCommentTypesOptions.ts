import {CommentTypes} from '@/enums/commentTypes';

import {translations} from '@/lib/translations';

export function commentTypesLabels() {
  const t = translations.comments.enums.types;

  return {
    [CommentTypes.GENERAL]: t.general,
    [CommentTypes.BUG]: t.bug,
    [CommentTypes.FEATURE]: t.feature,
    [CommentTypes.IMPROVEMENT]: t.improvement,
  };
}

export const getCommentTypesOptions = () => {
  const labels = commentTypesLabels();

  return Object.entries(labels).map(([value, label]) => ({
    value: value as CommentTypes,
    label,
  }));
};
