'use client';

import {useEffect, useState} from 'react';

import {redirect} from 'next/navigation';

import {useUser} from '@/contexts/UserContext';

import {
	AdminContainer,
	CommentsZone,
	DeleteConfirmationModal,
	LoadingSpinner,
	showToast,
	ToDoList,
} from '@/components';
import {ModalMode, TodoFilter, TodoStatuses} from '@/enums';
import {
	useCommentForm,
	useComments,
	useFetchComments,
	useFetchTodos,
	useTodoFiltering,
	useTodoForm,
	useTodos
} from '@/hooks';
import {BaseComment, CommentInsert, TodoInsert, TodoItem} from '@/types';

import {CommentModal, TodoModal, TodoStatsCards} from './components';

interface DeleteItem {
	type: 'todo' | 'comment';
	id: string;
	title: string;
}

export default function AdminDashboard() {
	const {user, loading, isAuthenticated, isAdmin} = useUser();

	const {data: todosData, loading: fetchLoading, refetch: refetchTodos} = useFetchTodos({enabled: false});
	const {createTodo, updateTodo, deleteTodo, updateTodoStatus, loading: crudTodoLoading} = useTodos();
	const todoForm = useTodoForm();
	const [todoFilter, setTodoFilter] = useState(TodoFilter.TODO);
	const {filteredTodos, todoStats} = useTodoFiltering({
		todos: todosData || [],
		todoFilter
	});
	const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);

	const {data: commentsData, loading: commentsLoading, refetch: commentsRefetch} = useFetchComments({enabled: false});
	const {createComment, updateComment, deleteComment, loading: crudCommentLoading} = useComments();
	const commentForm = useCommentForm();
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
			refetchTodos();
			commentsRefetch();
		}
	}, [loading, isAuthenticated, isAdmin, refetchTodos, commentsRefetch]);

	// ============ Comment Handlers ============
	const handleAddCommentOpen = () => {
		commentForm.openAddMode();
		setIsCommentModalOpen(true);
	};

	const handleEditCommentOpen = (comment: BaseComment) => {
		commentForm.openEditMode(comment);
		setIsCommentModalOpen(true);
	};

	const handleCommentModalClose = () => {
		setIsCommentModalOpen(false);
		commentForm.resetForm();
	};

	// Handle comment submission
	const handleCommentSubmit = async () => {
		const {valid, errors} = commentForm.validateForm();

		if (!valid) {
			errors.forEach(error => showToast.danger(error));
			return;
		}

		let success = false;

		if (commentForm.modalMode === ModalMode.ADD) {
			const insertData: CommentInsert = {
				...commentForm.formData,
				user_email: user?.email || '',
		}
		success = await createComment(insertData);
		} else {
			if (!commentForm.selectedComment) return;
			success = await updateComment(commentForm.selectedComment.id, commentForm.formData)
		}

		if (success) {
			await commentsRefetch();
			handleCommentModalClose();
		}
	};

	// Handle delete confirmation
	const handleDeleteClick = (type: 'todo' | 'comment', id: string, title: string) => {
		setDeleteItem({type, id, title});
		setIsDeleteModalOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!deleteItem) return;

		let success = false

		if (deleteItem.type === 'todo') {
			success = await deleteTodo(deleteItem.id);
			if (success) await refetchTodos();
		} else {
			success = await deleteComment(deleteItem.id);
			if (success) await commentsRefetch();
		}

		if (success) {
			setIsDeleteModalOpen(false);
			setDeleteItem(null);
		}
	};

	const handleDeleteCancel = () => {
		setIsDeleteModalOpen(false);
		setDeleteItem(null);
	};

	// ============ Todo Handlers ============
	const handleAddTodoOpen = () => {
		todoForm.openAddMode()
		setIsTodoModalOpen(true);
	};

	const handleEditTodoOpen = (todo: TodoItem) => {
		todoForm.openEditMode(todo);
		setIsTodoModalOpen(true);
	};

	const handleTodoModalClose = () => {
		setIsTodoModalOpen(false);
		todoForm.resetForm();
	};

	const handleTodoSubmit = async () => {
		const {valid, errors} = todoForm.validateForm();

		if (!valid) {
			errors.forEach(error => showToast.danger(error));
			return;
		}

		let success = false;

		if (todoForm.modalMode === ModalMode.ADD) {
			const insertData: TodoInsert = {
				...todoForm.formData,
				user_email: user?.email || '',
				created_by: user?.id || '',
			}
			success = await createTodo(insertData);
		} else {
			if (!todoForm.selectedTodo) return;
			success = await updateTodo(todoForm.selectedTodo.id, todoForm.formData)
		}

		if (success) {
			await refetchTodos();
			handleTodoModalClose();
		}
	};

	const handleTodoUpdateStatus = async (id: string, status: TodoStatuses) => {
		const success = await updateTodoStatus(id, status)
		if (success) await refetchTodos();
		return success;
	}

	const handleTodoDelete = async (id: string) => {
		const todo = todosData?.find((t) => t.id === id);
		handleDeleteClick('todo', id, todo?.title || 'Todo');
		return true;
	}

	const handleCommentDelete = async (id: string) => {
			const comment = commentsData.find((c) => c.id === id);
			handleDeleteClick('comment', id, comment?.content?.substring(0, 50) + '...' || 'Comment');
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<LoadingSpinner/>
				</div>
			</div>
		);
	}

	return (
		<>
			<AdminContainer>
				<TodoStatsCards
					stats={todoStats}
					todoFilter={todoFilter}
					setTodoFilter={setTodoFilter}
				/>

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 pt-4">
					<ToDoList
						todos={filteredTodos}
						todosLoading={fetchLoading || crudTodoLoading}
						handleAddTodo={handleAddTodoOpen}
						updateTodoStatus={handleTodoUpdateStatus}
						deleteTodo={handleTodoDelete}
						handleEditTodo={handleEditTodoOpen}
					/>

					<CommentsZone
						comments={commentsData}
						commentsLoading={commentsLoading || crudCommentLoading}
						handleEditComment={handleEditCommentOpen}
						deleteComment={handleCommentDelete}
						onAddCommentOpen={handleAddCommentOpen}
					/>
				</div>
			</AdminContainer>

			<TodoModal
				isOpen={isTodoModalOpen}
				onClose={handleTodoModalClose}
				todoFormData={todoForm.formData}
				setTodoFormData={todoForm.setFormData}
				onSubmit={handleTodoSubmit}
				mode={todoForm.modalMode}
				isLoading={crudTodoLoading}
			/>

			<CommentModal
				isOpen={isCommentModalOpen}
				onClose={handleCommentModalClose}
				onSubmit={handleCommentSubmit}
				commentFormData={commentForm.formData}
				setCommentFormData={commentForm.setFormData}
				mode={commentForm.modalMode}
				isLoading={crudCommentLoading}
			/>

			<DeleteConfirmationModal
				isOpen={isDeleteModalOpen}
				onClose={handleDeleteCancel}
				onConfirm={handleDeleteConfirm}
				title={`Delete ${deleteItem?.type === 'todo' ? 'Todo' : 'Comment'}`}
				message={`Are you sure you want to delete "${deleteItem?.title}"? This action cannot be undone.`}
				isLoading={crudTodoLoading || crudCommentLoading}
			/>
		</>
	);
}
