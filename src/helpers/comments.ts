import {CommentTypes, getCommentTypesOptions} from '@/enums';

export const getCommentTypeLabel = (type: CommentTypes) =>
  getCommentTypesOptions().find((option) => option.value === type)?.label;
