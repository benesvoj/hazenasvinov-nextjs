import {CommentTypes, ModalMode} from '@/enums';
import {CommentSchema} from "@/types";

export interface BaseComment extends CommentSchema {
  type: CommentTypes;
}

export type CommentFormData = Omit<BaseComment, 'id' | 'created_at' | 'updated_at'>;

export interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  commentFormData: CommentFormData;
  setCommentFormData: (commentFormData: CommentFormData) => void;
  mode: ModalMode;
  isLoading?: boolean;
}

export interface CommentsZoneItemProps {
  comment: BaseComment;
  handleEditComment: (comment: BaseComment) => void;
  deleteComment: (id: string) => void;
}

export interface CommentsZoneProps {
  comments: BaseComment[];
  commentsLoading: boolean;
  handleEditComment: (comment: BaseComment) => void;
  deleteComment: (id: string) => void;
  onAddCommentOpen: () => void;
}
