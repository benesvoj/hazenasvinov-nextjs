import {getCommentTypesOptions} from '@/enums/getCommentTypesOptions';

import {CommentTypes} from '@/enums';

export const getCommentTypeLabel = (type: CommentTypes) =>
  getCommentTypesOptions().find((option) => option.value === type)?.label;
