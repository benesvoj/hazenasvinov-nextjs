'use client';

import {useState, useEffect} from 'react';

import {redirect} from 'next/navigation';

import {useUser} from '@/contexts/UserContext';

import {
  ToDoList,
  CommentsZone,
  AdminContainer,
  LoadingSpinner,
  DeleteConfirmationModal,
} from '@/components';
import {ModalMode} from '@/enums';
import {useTodos, useComments} from '@/hooks';
import {Comment, TodoItem} from '@/types';

import {TodoModal, TodoStatsCards, CommentModal} from './components';

interface DeleteItem {
  type: 'todo' | 'comment';
  id: string;
  title: string;
}

export default function AdminDashboard() {
  const {user, userProfile, loading, isAuthenticated, isAdmin} = useUser();

  // Use hooks
  const todos = useTodos(user?.email);
  const {loadTodos, updateTodo, selectedTodo} = todos;

  const comments = useComments(user?.email);
  const {loadComments, updateComment, selectedComment} = comments;

  // Todo modal state
  const [todoModalMode, setTodoModalMode] = useState<ModalMode>(ModalMode.ADD);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);

  // Comment modal state
  const [commentModalMode, setCommentModalMode] = useState<ModalMode>(ModalMode.ADD);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);

  // Delete confirmation state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<DeleteItem | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      redirect('/login');
      return;
    }

    if (!loading && isAuthenticated && !isAdmin) {
      redirect('/login?error=no_admin_access');
      return;
    }

    if (!loading && isAuthenticated && isAdmin) {
      // Load data after user is confirmed
      loadTodos();
      loadComments();
    }
  }, [loading, isAuthenticated, isAdmin, loadTodos, loadComments]);

  // Handle comment modal open for add
  const handleAddCommentOpen = () => {
    setCommentModalMode(ModalMode.ADD);
    comments.handleAddComment();
    setIsCommentModalOpen(true);
  };

  // Handle comment modal open for edit
  const handleEditCommentOpen = (comment: Comment) => {
    setCommentModalMode(ModalMode.EDIT);
    comments.handleEditComment(comment);
    setIsCommentModalOpen(true);
  };

  // Handle comment modal close
  const handleCommentModalClose = () => {
    setIsCommentModalOpen(false);
    comments.resetCommentForm();
  };

  // Handle comment submission
  const handleCommentSubmit = async () => {
    if (commentModalMode === ModalMode.ADD) {
      await comments.addComment(user?.email);
    } else {
      if (!selectedComment) return;
      const {id, author, user_email, created_at, ...updateData} = comments.commentFormData;
      await comments.updateComment(selectedComment.id, updateData);
    }
    handleCommentModalClose();
  };

  // Handle delete confirmation
  const handleDeleteClick = (type: 'todo' | 'comment', id: string, title: string) => {
    setDeleteItem({type, id, title});
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;

    if (deleteItem.type === 'todo') {
      await todos.deleteTodo(deleteItem.id);
    } else {
      await comments.deleteComment(deleteItem.id);
    }

    setIsDeleteModalOpen(false);
    setDeleteItem(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setDeleteItem(null);
  };

  // Handle todo modal open for add
  const handleAddTodoOpen = () => {
    setTodoModalMode(ModalMode.ADD);
    todos.resetTodoForm();
    setIsTodoModalOpen(true);
  };

  // Handle todo modal open for edit
  const handleEditTodoOpen = (todo: TodoItem) => {
    setTodoModalMode(ModalMode.EDIT);
    todos.handleEditTodo(todo);
    setIsTodoModalOpen(true);
  };

  // Handle todo modal close
  const handleTodoModalClose = () => {
    setIsTodoModalOpen(false);
    todos.resetTodoForm();
  };

  // Handle todo submission
  const handleTodoSubmit = async () => {
    if (todoModalMode === ModalMode.ADD) {
      await todos.addTodo();
    } else {
      if (!selectedTodo) return;
      const {id, created_at, updated_at, user_email, ...updateData} = todos.todoFormData;
      await updateTodo(selectedTodo.id, updateData);
    }
    handleTodoModalClose();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <AdminContainer>
      <TodoStatsCards todos={todos} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <ToDoList
          todos={todos.filteredTodos}
          todosLoading={todos.todosLoading}
          handleAddTodo={handleAddTodoOpen}
          updateTodoStatus={todos.updateTodoStatus}
          deleteTodo={(id: string) => {
            const todo = todos.todos.find((t) => t.id === id);
            handleDeleteClick('todo', id, todo?.title || 'Todo');
          }}
          handleEditTodo={handleEditTodoOpen}
          currentFilter={todos.todoFilter}
        />

        <CommentsZone
          comments={comments.comments}
          commentsLoading={comments.commentsLoading}
          handleAddComment={handleAddCommentOpen}
          handleEditComment={handleEditCommentOpen}
          deleteComment={(id: string) => {
            const comment = comments.comments.find((c) => c.id === id);
            handleDeleteClick(
              'comment',
              id,
              comment?.content?.substring(0, 50) + '...' || 'Comment'
            );
          }}
          onAddCommentOpen={handleAddCommentOpen}
        />
      </div>

      <TodoModal
        isOpen={isTodoModalOpen}
        onClose={handleTodoModalClose}
        todoFormData={todos.todoFormData}
        setTodoFormData={todos.setTodoFormData}
        onSubmit={handleTodoSubmit}
        mode={todoModalMode}
      />

      {/* Comment Modal */}
      <CommentModal
        isOpen={isCommentModalOpen}
        onClose={handleCommentModalClose}
        onSubmit={handleCommentSubmit}
        commentFormData={comments.commentFormData}
        setCommentFormData={comments.setCommentFormData}
        mode={commentModalMode}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${deleteItem?.type === 'todo' ? 'Todo' : 'Comment'}`}
        message={`Are you sure you want to delete "${deleteItem?.title}"? This action cannot be undone.`}
      />
    </AdminContainer>
  );
}
