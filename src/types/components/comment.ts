import {CommentTypes, ModalMode} from '@/enums';

export interface Comment {
  id: string;
  content: string;
  author: string;
  user_email: string;
  created_at: string;
  type: CommentTypes;
}

export interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  commentFormData: Comment;
  setCommentFormData: (commentFormData: Comment) => void;
  mode: ModalMode;
}

export interface CommentsZoneItemProps {
  comment: Comment;
  handleEditComment: (comment: Comment) => void;
  deleteComment: (id: string) => void;
}
