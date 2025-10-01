'use client';

import {useState, useCallback} from 'react';

import {createClient} from '@/utils/supabase/client';

import {showToast} from '@/components';
import {CommentTypes} from '@/enums';
import {Comment} from '@/types';

export interface UseCommentsReturn {
  // State
  comments: Comment[];
  commentsLoading: boolean;
  selectedComment: Comment | null;
  commentFormData: Comment;

  // Actions
  setSelectedComment: (comment: Comment | null) => void;
  setCommentFormData: (data: Comment) => void;

  // CRUD operations
  loadComments: () => Promise<void>;
  addComment: (userEmail?: string) => Promise<void>;
  updateComment: (id: string, updates: Partial<Comment>) => Promise<void>;
  deleteComment: (id: string) => Promise<void>;

  // Form handlers
  handleAddComment: () => void;
  handleEditComment: (comment: Comment) => void;
  resetCommentForm: () => void;
}

const getDefaultCommentFormData = (): Comment => ({
  id: '',
  content: '',
  author: '',
  user_email: '',
  created_at: '',
  type: CommentTypes.GENERAL,
});

export const useComments = (userEmail?: string): UseCommentsReturn => {
  // State
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [commentFormData, setCommentFormData] = useState<Comment>(getDefaultCommentFormData());

  // Load comments from database
  const loadComments = useCallback(async () => {
    try {
      setCommentsLoading(true);
      const supabase = createClient();

      // First check if the comments table exists
      const {data: tableCheck, error: tableError} = await supabase
        .from('comments')
        .select('id')
        .limit(1);

      if (tableError) {
        if (
          tableError.message &&
          tableError.message.includes('relation "comments" does not exist')
        ) {
          setComments([]);
          return;
        }
        throw tableError;
      }

      const {data, error} = await supabase
        .from('comments')
        .select('*')
        .order('created_at', {ascending: false});

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      console.error('Error loading comments:', error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  // Add new comment
  const addComment = useCallback(
    async (userEmail?: string) => {
      try {
        const supabase = createClient();
        const {error} = await supabase.from('comments').insert({
          content: commentFormData.content,
          type: commentFormData.type,
          author: userEmail || 'Unknown',
          user_email: userEmail || 'unknown@hazenasvinov.cz',
        });

        if (error) {
          if (error.message.includes('relation "comments" does not exist')) {
            return;
          }
          throw error;
        }

        await loadComments();
        showToast.success('Comment added successfully!');
      } catch (error: any) {
        console.error('Error adding comment:', error);
        showToast.danger('Failed to add comment');
      }
    },
    [commentFormData, loadComments]
  );

  // Update existing comment
  const updateComment = useCallback(
    async (id: string, updates: Partial<Comment>) => {
      try {
        const supabase = createClient();
        const {error} = await supabase.from('comments').update(updates).eq('id', id);

        if (error) throw error;

        await loadComments();
        showToast.success('Comment updated successfully!');
      } catch (error: any) {
        console.error('Error updating comment:', error);
        showToast.danger('Failed to update comment');
      }
    },
    [loadComments]
  );

  // Delete comment
  const deleteComment = useCallback(
    async (id: string) => {
      try {
        const supabase = createClient();
        const {error} = await supabase.from('comments').delete().eq('id', id);

        if (error) throw error;

        await loadComments();
        showToast.success('Comment deleted successfully!');
      } catch (error: any) {
        console.error('Error deleting comment:', error);
        showToast.danger('Failed to delete comment');
      }
    },
    [loadComments]
  );

  // Reset form to default values
  const resetCommentForm = useCallback(() => {
    setCommentFormData(getDefaultCommentFormData());
  }, []);

  // Handle add comment button click
  const handleAddComment = useCallback(() => {
    resetCommentForm();
  }, [resetCommentForm]);

  // Handle edit comment button click
  const handleEditComment = useCallback((comment: Comment) => {
    setSelectedComment(comment);
    setCommentFormData({
      content: comment.content,
      type: comment.type,
      id: comment.id,
      author: comment.author,
      user_email: comment.user_email,
      created_at: comment.created_at,
    });
  }, []);

  return {
    // State
    comments,
    commentsLoading,
    selectedComment,
    commentFormData,

    // Actions
    setSelectedComment,
    setCommentFormData,

    // CRUD operations
    loadComments,
    addComment,
    updateComment,
    deleteComment,

    // Form handlers
    handleAddComment,
    handleEditComment,
    resetCommentForm,
  };
};
