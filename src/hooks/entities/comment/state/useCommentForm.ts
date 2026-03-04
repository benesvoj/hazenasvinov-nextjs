'use client';

import {translations} from '@/lib/translations';

import {CommentTypes} from '@/enums';
import {createFormHook} from '@/hooks';
import {CommentFormData, BaseComment} from '@/types';

const initialFormData: CommentFormData = {
  content: '',
  author: '',
  user_email: '',
  type: CommentTypes.GENERAL,
};

const t = translations.comments.responseMessages;

export function useCommentForm() {
  return createFormHook<BaseComment, CommentFormData>({
    initialFormData,
    validationRules: [
      {field: 'content', message: t.mandatoryContent},
      {field: 'type', message: t.mandatoryType},
    ],
  })();
}
