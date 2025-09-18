'use client';

import {createClient} from '@/utils/supabase/client';
import {redirect} from 'next/navigation';
import {useUser} from '@/contexts/UserContext';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FireIcon,
} from '@heroicons/react/24/outline';
import {useState, useEffect} from 'react';
import {
  Button,
  Card,
  CardBody,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';
import {ReleaseNote, getReleaseNotes} from '@/utils/releaseNotes';
import {showToast} from '@/components';
import {ToDoList, CommentsZone} from './components';
import {TodoItem} from '@/utils/todos';
import {Comment} from '@/types';

export default function AdminDashboard() {
  const {user, userProfile, loading, isAuthenticated, isAdmin} = useUser();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [todosLoading, setTodosLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  // Modal states
  const {isOpen: isAddTodoOpen, onOpen: onAddTodoOpen, onClose: onAddTodoClose} = useDisclosure();
  const {
    isOpen: isEditTodoOpen,
    onOpen: onEditTodoOpen,
    onClose: onEditTodoClose,
  } = useDisclosure();
  const {
    isOpen: isAddCommentOpen,
    onOpen: onAddCommentOpen,
    onClose: onAddCommentClose,
  } = useDisclosure();
  const {
    isOpen: isEditCommentOpen,
    onOpen: onEditCommentOpen,
    onClose: onEditCommentClose,
  } = useDisclosure();

  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [todoFormData, setTodoFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TodoItem['priority'],
    status: 'todo' as TodoItem['status'],
    category: 'improvement' as TodoItem['category'],
    due_date: '',
  });
  const [commentFormData, setCommentFormData] = useState({
    content: '',
    type: 'general' as Comment['type'],
  });
  const [editCommentFormData, setEditCommentFormData] = useState({
    content: '',
    type: 'general' as Comment['type'],
  });

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
      loadReleaseNotes();
      loadTodos();
    }
  }, [loading, isAuthenticated, isAdmin]);

  const loadTodos = async () => {
    try {
      setTodosLoading(true);
      const supabase = createClient();

      // First check if the todos table exists
      const {data: tableCheck, error: tableError} = await supabase
        .from('todos')
        .select('id')
        .limit(1);

      if (tableError) {
        if (tableError.message && tableError.message.includes('relation "todos" does not exist')) {
          setTodos([]);
          return;
        }
        throw tableError;
      }

      const {data, error} = await supabase
        .from('todos')
        .select('*')
        .order('created_at', {ascending: false});

      if (error) throw error;
      setTodos(data || []);
    } catch (error: any) {
      setTodos([]);
    } finally {
      setTodosLoading(false);
    }
  };

  const loadReleaseNotes = () => {
    try {
      const notes = getReleaseNotes();
      setReleaseNotes(notes);
    } catch (error) {
      setReleaseNotes([]);
    }
  };

  const handleAddTodo = () => {
    setTodoFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      category: 'improvement',
      due_date: '',
    });
    onAddTodoOpen();
  };

  const addTodo = async () => {
    try {
      const supabase = createClient();
      const {error} = await supabase.from('todos').insert({
        title: todoFormData.title,
        description: todoFormData.description,
        priority: todoFormData.priority,
        status: todoFormData.status,
        category: todoFormData.category,
        due_date: todoFormData.due_date || null,
        user_email: user?.email || 'unknown@hazenasvinov.cz',
      });

      if (error) {
        if (error.message.includes('relation "todos" does not exist')) {
          return;
        }
        throw error;
      }

      onAddTodoClose();
      loadTodos();
    } catch (error) {}
  };

  const handleEditTodo = (todo: TodoItem) => {
    setSelectedTodo(todo);
    setTodoFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      status: todo.status,
      category: todo.category,
      due_date: todo.due_date || '',
    });
    onEditTodoOpen();
  };

  const updateTodo = async () => {
    if (!selectedTodo) return;

    try {
      const supabase = createClient();
      const {error} = await supabase
        .from('todos')
        .update({
          title: todoFormData.title,
          description: todoFormData.description,
          priority: todoFormData.priority,
          status: todoFormData.status,
          category: todoFormData.category,
          due_date: todoFormData.due_date || null,
        })
        .eq('id', selectedTodo.id);

      if (error) throw error;

      onEditTodoClose();
      setSelectedTodo(null);
      loadTodos();
    } catch (error) {
      showToast.danger('Chyba při aktualizaci úkolu');
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const supabase = createClient();
      const {error} = await supabase.from('todos').delete().eq('id', id);

      if (error) throw error;
      loadTodos(); // Reload todos from database
    } catch (error) {
      showToast.danger(`Error deleting todo:${error}`);
    }
  };

  const updateTodoStatus = async (id: string, status: string) => {
    try {
      const supabase = createClient();
      const {error} = await supabase.from('todos').update({status}).eq('id', id);

      if (error) throw error;
      loadTodos(); // Reload todos from database
    } catch (error) {
      showToast.danger(`Error updating todo:${error}`);
    }
  };

  const addComment = async () => {
    try {
      const supabase = createClient();
      const {error} = await supabase.from('comments').insert({
        content: commentFormData.content,
        type: commentFormData.type,
        author: user?.email || 'Unknown',
        user_email: user?.email || 'unknown@hazenasvinov.cz',
      });

      if (error) {
        if (error.message.includes('relation "comments" does not exist')) {
          return;
        }
        throw error;
      }

      onAddCommentClose();
      setCommentFormData({content: '', type: 'general'});
      loadComments();
    } catch (error) {
      showToast.danger(`Error adding comment:${error}`);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setSelectedComment(comment);
    setEditCommentFormData({
      content: comment.content,
      type: comment.type,
    });
    onEditCommentOpen();
  };

  const updateComment = async () => {
    if (!selectedComment) return;

    try {
      const supabase = createClient();
      const {error} = await supabase
        .from('comments')
        .update({
          content: editCommentFormData.content,
          type: editCommentFormData.type,
        })
        .eq('id', selectedComment.id);

      if (error) throw error;

      onEditCommentClose();
      setSelectedComment(null);
      loadComments();
    } catch (error) {
      showToast.danger(`Error updating comment:${error}`);
    }
  };

  const deleteComment = async (id: string) => {
    try {
      const supabase = createClient();
      const {error} = await supabase.from('comments').delete().eq('id', id);

      if (error) throw error;
      loadComments();
    } catch (error) {
      showToast.danger(`Error deleting comment:${error}`);
    }
  };

  const loadComments = async () => {
    try {
      const supabase = createClient();

      // First check if the comments table exists
      const {data: tableCheck, error: tableError} = await supabase
        .from('comments')
        .select('id')
        .limit(1);

      if (tableError) {
        showToast.danger(`Comments table error:${tableError}`);
        if (
          tableError.message &&
          tableError.message.includes('relation "comments" does not exist')
        ) {
          showToast.danger('Comments table does not exist. Run: npm run setup:missing-tables');
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
      showToast.danger(`Error loading comments:${error}`);
      setComments([]);
    }
  };

  useEffect(() => {
    loadComments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ExclamationTriangleIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {todos.filter((t) => t.status === 'todo').length}
            </div>
            <div className="text-sm text-gray-600">To Do</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ClockIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {todos.filter((t) => t.status === 'in-progress').length}
            </div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {todos.filter((t) => t.status === 'done').length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FireIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">
              {todos.filter((t) => t.priority === 'urgent').length}
            </div>
            <div className="text-sm text-gray-600">High Priority</div>
          </CardBody>
        </Card>
      </div>

      {/* Two Zones Layout - 50:50 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Todo List Zone */}
        <ToDoList
          todos={todos}
          todosLoading={todosLoading}
          handleAddTodo={handleAddTodo}
          updateTodoStatus={updateTodoStatus}
          deleteTodo={deleteTodo}
          handleEditTodo={handleEditTodo}
        />

        {/* Comments Zone */}
        <CommentsZone
          comments={comments}
          commentsLoading={commentsLoading}
          handleAddComment={addComment}
          handleEditComment={handleEditComment}
          deleteComment={deleteComment}
          onAddCommentOpen={onAddCommentOpen}
        />
      </div>

      {/* Modals */}
      {/* Add Todo Modal */}
      <Modal isOpen={isAddTodoOpen} onClose={onAddTodoClose} size="2xl">
        <ModalContent>
          <ModalHeader>Add New Todo</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Title"
                value={todoFormData.title}
                onChange={(e) => setTodoFormData({...todoFormData, title: e.target.value})}
                isRequired
                placeholder="Enter todo title"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white min-h-[100px] resize-y"
                  value={todoFormData.description}
                  onChange={(e) => setTodoFormData({...todoFormData, description: e.target.value})}
                  placeholder="Enter description (optional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={todoFormData.priority}
                  onChange={(e) =>
                    setTodoFormData({
                      ...todoFormData,
                      priority: e.target.value as TodoItem['priority'],
                    })
                  }
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={todoFormData.category}
                  onChange={(e) =>
                    setTodoFormData({
                      ...todoFormData,
                      category: e.target.value as TodoItem['category'],
                    })
                  }
                >
                  <option value="feature">Feature</option>
                  <option value="bug">Bug</option>
                  <option value="improvement">Improvement</option>
                  <option value="technical">Technical</option>
                </select>
              </div>
              <Input
                label="Due Date"
                type="date"
                value={todoFormData.due_date}
                onChange={(e) => setTodoFormData({...todoFormData, due_date: e.target.value})}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onAddTodoClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={addTodo}>
              Add Todo
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Todo Modal */}
      <Modal isOpen={isEditTodoOpen} onClose={onEditTodoClose} size="2xl">
        <ModalContent>
          <ModalHeader>Edit Todo</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Title"
                value={todoFormData.title}
                onChange={(e) => setTodoFormData({...todoFormData, title: e.target.value})}
                isRequired
                placeholder="Enter todo title"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white min-h-[100px] resize-y"
                  value={todoFormData.description}
                  onChange={(e) => setTodoFormData({...todoFormData, description: e.target.value})}
                  placeholder="Enter description (optional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={todoFormData.priority}
                  onChange={(e) =>
                    setTodoFormData({
                      ...todoFormData,
                      priority: e.target.value as TodoItem['priority'],
                    })
                  }
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={todoFormData.status}
                  onChange={(e) =>
                    setTodoFormData({...todoFormData, status: e.target.value as TodoItem['status']})
                  }
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                value={todoFormData.category}
                onChange={(e) =>
                  setTodoFormData({
                    ...todoFormData,
                    category: e.target.value as TodoItem['category'],
                  })
                }
              >
                <option value="feature">Feature</option>
                <option value="bug">Bug</option>
                <option value="improvement">Improvement</option>
                <option value="technical">Technical</option>
              </select>
              <Input
                label="Due Date"
                type="date"
                value={todoFormData.due_date}
                onChange={(e) => setTodoFormData({...todoFormData, due_date: e.target.value})}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onEditTodoClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={updateTodo}>
              Update Todo
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Add Comment Modal */}
      <Modal isOpen={isAddCommentOpen} onClose={onAddCommentClose} size="lg">
        <ModalContent>
          <ModalHeader>Add Comment</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comment Type
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={commentFormData.type}
                  onChange={(e) =>
                    setCommentFormData({
                      ...commentFormData,
                      type: e.target.value as Comment['type'],
                    })
                  }
                >
                  <option value="general">ℹ️ General</option>
                  <option value="bug">🐛 Bug Report</option>
                  <option value="feature">✨ Feature Request</option>
                  <option value="improvement">🔧 Improvement</option>
                </select>
              </div>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white min-h-[100px] resize-y"
                value={commentFormData.content}
                onChange={(e) => setCommentFormData({...commentFormData, content: e.target.value})}
                placeholder="Enter your comment..."
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onAddCommentClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={addComment}>
              Add Comment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Edit Comment Modal */}
      <Modal isOpen={isEditCommentOpen} onClose={onEditCommentClose} size="lg">
        <ModalContent>
          <ModalHeader>Edit Comment</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Author:</strong> {selectedComment?.user_email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Created:</strong>{' '}
                  {selectedComment?.created_at
                    ? new Date(selectedComment.created_at).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comment Type
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={editCommentFormData.type}
                  onChange={(e) =>
                    setEditCommentFormData({
                      ...editCommentFormData,
                      type: e.target.value as Comment['type'],
                    })
                  }
                >
                  <option value="general">ℹ️ General</option>
                  <option value="bug">🐛 Bug Report</option>
                  <option value="feature">✨ Feature Request</option>
                  <option value="improvement">🔧 Improvement</option>
                </select>
              </div>
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white min-h-[100px] resize-y"
                value={editCommentFormData.content}
                onChange={(e) =>
                  setEditCommentFormData({...editCommentFormData, content: e.target.value})
                }
                placeholder="Enter your comment..."
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onEditCommentClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={updateComment}>
              Update Comment
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
