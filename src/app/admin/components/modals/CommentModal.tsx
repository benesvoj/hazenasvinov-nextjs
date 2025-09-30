import {Button, Select, SelectItem, Textarea} from '@heroui/react';

import {UnifiedModal} from '@/components';
import {CommentTypes, getCommentTypesOptions, ModalMode} from '@/enums';
import {translations} from '@/lib';
import {CommentModalProps} from '@/types';

export const CommentModal = ({
  isOpen,
  onSubmit,
  onClose,
  commentFormData,
  setCommentFormData,
  mode,
}: CommentModalProps) => {
  const t = translations.common.commentModal;
  const tButton = translations.button;

  const isEditMode = mode === ModalMode.EDIT;
  const modalTitle = isEditMode ? t.titleEdit : t.titleAdd;

  return (
    <UnifiedModal
      title={modalTitle}
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="flat" onPress={onClose}>
            {tButton.cancel}
          </Button>
          <Button color="primary" onPress={onSubmit}>
            {isEditMode ? tButton.save : tButton.add}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Select
          label={t.commentType}
          aria-label={t.commentType}
          placeholder={t.commentTypePlaceholder}
          selectedKeys={commentFormData.type ? [commentFormData.type] : []}
          onSelectionChange={(keys) => {
            const selectedKey = Array.from(keys)[0] as CommentTypes;
            if (selectedKey) {
              setCommentFormData({
                ...commentFormData,
                type: selectedKey,
              });
            }
          }}
        >
          {getCommentTypesOptions().map(({value, label}) => (
            <SelectItem key={value}>{label}</SelectItem>
          ))}
        </Select>
        <Textarea
          value={commentFormData.content}
          onChange={(e) => setCommentFormData({...commentFormData, content: e.target.value})}
          placeholder={t.commentContentPlaceholder}
          aria-label={t.commentContent}
          label={t.commentContent}
        />
      </div>
    </UnifiedModal>
  );
};
