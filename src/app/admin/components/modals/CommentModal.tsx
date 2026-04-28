'use client';

import {Textarea} from '@heroui/react';

import {getCommentTypesOptions} from '@/enums/getCommentTypesOptions';

import {translations} from '@/lib/translations';

import {Choice, Dialog} from '@/components';
import {CommentTypes, ModalMode} from '@/enums';
import {CommentModalProps} from '@/types';

export const CommentModal = ({
  isOpen,
  onSubmit,
  onClose,
  commentFormData,
  setCommentFormData,
  mode,
  isLoading,
}: CommentModalProps) => {
  const t = translations.comments.commentModal;
  const tAction = translations.common.actions;

  const isEditMode = mode === ModalMode.EDIT;
  const modalTitle = isEditMode ? t.titleEdit : t.titleAdd;
  const submitButtonLabel = isEditMode ? tAction.save : tAction.add;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      onSubmit={onSubmit}
      isLoading={isLoading}
      submitButtonLabel={submitButtonLabel}
      size={'md'}
    >
      <Choice
        label={t.commentType}
        aria-label={t.commentType}
        placeholder={t.commentTypePlaceholder}
        value={commentFormData.type}
        items={getCommentTypesOptions().map((c) => ({key: c.value, label: c.label}))}
        onChange={(id) => setCommentFormData({...commentFormData, type: id as CommentTypes})}
      />
      <Textarea
        size={'sm'}
        value={commentFormData.content}
        onChange={(e) => setCommentFormData({...commentFormData, content: e.target.value})}
        placeholder={t.commentContentPlaceholder}
        aria-label={t.commentContent}
        label={t.commentContent}
      />
    </Dialog>
  );
};
