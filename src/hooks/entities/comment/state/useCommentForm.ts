'use client';
import {CommentTypes} from '@/enums';
import {createFormHook} from '@/hooks';
import {translations} from '@/lib';
import {CommentFormData, BaseComment} from '@/types';

const initialFormData: CommentFormData = {
  content: '',
  author: '',
  user_email: '',
  type: CommentTypes.GENERAL,
};

const t = translations.admin.comments.responseMessages;

export const useCommentForm = createFormHook<BaseComment, CommentFormData>({
  initialFormData,
  validationRules: [
    {field: 'content', message: t.mandatoryContent},
    {field: 'type', message: t.mandatoryType},
  ],
});
