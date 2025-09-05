'use client';

import { createClient } from "@/utils/supabase/client";
import { redirect } from "next/navigation";
import { logout } from "@/utils/supabase/actions";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon,
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ChatBubbleLeftRightIcon,
  FlagIcon,
  FireIcon,
  BoltIcon,
  WrenchScrewdriverIcon,
  BugAntIcon,
  SparklesIcon,
  Cog6ToothIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Input } from "@heroui/input";
import { 
  TodoItem, 
  getPriorityLabel,
  getStatusLabel,
  getCategoryLabel
} from "@/utils/todos";
import { 
  ReleaseNote,
  getReleaseNotes
} from "@/utils/releaseNotes";
import { Chip } from "@heroui/react";
import { showToast } from "@/components";

interface Comment {
  id: string;
  content: string;
  author: string;
  user_email: string;
  created_at: string;
  type: 'general' | 'bug' | 'feature' | 'improvement';
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [releaseNotes, setReleaseNotes] = useState<ReleaseNote[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [todosLoading, setTodosLoading] = useState(true);
  
  // Modal states
  const { isOpen: isAddTodoOpen, onOpen: onAddTodoOpen, onClose: onAddTodoClose } = useDisclosure();
  const { isOpen: isEditTodoOpen, onOpen: onEditTodoOpen, onClose: onEditTodoClose } = useDisclosure();
  const { isOpen: isAddCommentOpen, onOpen: onAddCommentOpen, onClose: onAddCommentClose } = useDisclosure();
  const { isOpen: isEditCommentOpen, onOpen: onEditCommentOpen, onClose: onEditCommentClose } = useDisclosure();
  
  const [selectedTodo, setSelectedTodo] = useState<TodoItem | null>(null);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [todoFormData, setTodoFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TodoItem['priority'],
    status: 'todo' as TodoItem['status'],
    category: 'improvement' as TodoItem['category'],
    due_date: ''
  });
  const [commentFormData, setCommentFormData] = useState({
    content: '',
    type: 'general' as Comment['type']
  });
  const [editCommentFormData, setEditCommentFormData] = useState({
    content: '',
    type: 'general' as Comment['type']
  });

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      
      if (error || !data?.user) {
        redirect('/login');
        return;
      }
      setUser(data.user);
      setLoading(false);
      
      // Load data after user is confirmed
      loadReleaseNotes();
      loadTodos();
    };

    checkUser();
  }, []);

  const loadTodos = async () => {
    try {
      setTodosLoading(true);
      const supabase = createClient();
      
      // First check if the todos table exists
      const { data: tableCheck, error: tableError } = await supabase
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

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

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

  const handleLogout = async () => {
    await logout();
  };

  const handleAddTodo = () => {
    setTodoFormData({
      title: '',
      description: '',
      priority: 'medium',
      status: 'todo',
      category: 'improvement',
      due_date: ''
    });
    onAddTodoOpen();
  };

  const addTodo = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('todos')
        .insert({
          title: todoFormData.title,
          description: todoFormData.description,
          priority: todoFormData.priority,
          status: todoFormData.status,
          category: todoFormData.category,
          due_date: todoFormData.due_date || null,
          user_email: user?.email || 'unknown@hazenasvinov.cz'
        });

      if (error) {
        if (error.message.includes('relation "todos" does not exist')) {
          return;
        }
        throw error;
      }
      
      onAddTodoClose();
      loadTodos();
    } catch (error) {
    }
  };

  const handleEditTodo = (todo: TodoItem) => {
    setSelectedTodo(todo);
    setTodoFormData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority,
      status: todo.status,
      category: todo.category,
      due_date: todo.due_date || ''
    });
    onEditTodoOpen();
  };

  const updateTodo = async () => {
    if (!selectedTodo) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('todos')
        .update({
          title: todoFormData.title,
          description: todoFormData.description,
          priority: todoFormData.priority,
          status: todoFormData.status,
          category: todoFormData.category,
          due_date: todoFormData.due_date || null
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
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadTodos(); // Reload todos from database
    } catch (error) {
      showToast.danger(`Error deleting todo:${error}`);
    }
  };

  const updateTodoStatus = async (id: string, status: TodoItem['status']) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('todos')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      loadTodos(); // Reload todos from database
    } catch (error) {
      showToast.danger(`Error updating todo:${error}`);
    }
  };

  const getStatusIcon = (status: TodoItem['status']) => {
    switch (status) {
      case 'done': return <CheckCircleIcon className="w-4 h-4" />;
      case 'in-progress': return <ClockIcon className="w-4 h-4" />;
      case 'todo': return <ExclamationTriangleIcon className="w-4 h-4" />;
      default: return <ExclamationTriangleIcon className="w-4 h-4" />;
    }
  };

  const getPriorityIcon = (priority: TodoItem['priority']) => {
    switch (priority) {
      case 'urgent': return <FireIcon className="w-4 h-4" />;
      case 'high': return <FlagIcon className="w-4 h-4" />;
      case 'medium': return <BoltIcon className="w-4 h-4" />;
      case 'low': return <ExclamationTriangleIcon className="w-4 h-4" />;
      default: return <BoltIcon className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: TodoItem['category']) => {
    switch (category) {
      case 'feature': return <SparklesIcon className="w-4 h-4" />;
      case 'bug': return <BugAntIcon className="w-4 h-4" />;
      case 'improvement': return <WrenchScrewdriverIcon className="w-4 h-4" />;
      case 'technical': return <Cog6ToothIcon className="w-4 h-4" />;
      default: return <WrenchScrewdriverIcon className="w-4 h-4" />;
    }
  };

  const getCommentTypeIcon = (type: Comment['type']) => {
    switch (type) {
      case 'general': return <InformationCircleIcon className="w-4 h-4" />;
      case 'bug': return <BugAntIcon className="w-4 h-4" />;
      case 'feature': return <SparklesIcon className="w-4 h-4" />;
      case 'improvement': return <WrenchScrewdriverIcon className="w-4 h-4" />;
      default: return <InformationCircleIcon className="w-4 h-4" />;
    }
  };

  const getCommentTypeLabel = (type: Comment['type']) => {
    switch (type) {
      case 'general': return 'General';
      case 'bug': return 'Bug Report';
      case 'feature': return 'Feature Request';
      case 'improvement': return 'Improvement';
      default: return 'General';
    }
  };

  const addComment = async () => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('comments')
        .insert({
          content: commentFormData.content,
          type: commentFormData.type,
          author: user?.email || 'Unknown',
          user_email: user?.email || 'unknown@hazenasvinov.cz'
        });

      if (error) {
        if (error.message.includes('relation "comments" does not exist')) {
          return;
        }
        throw error;
      }
      
      onAddCommentClose();
      setCommentFormData({ content: '', type: 'general' });
      loadComments();
    } catch (error) {
      showToast.danger(`Error adding comment:${error}`);
    }
  };

  const handleEditComment = (comment: Comment) => {
    setSelectedComment(comment);
    setEditCommentFormData({
      content: comment.content,
      type: comment.type
    });
    onEditCommentOpen();
  };

  const updateComment = async () => {
    if (!selectedComment) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('comments')
        .update({
          content: editCommentFormData.content,
          type: editCommentFormData.type
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
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', id);

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
      const { data: tableCheck, error: tableError } = await supabase
        .from('comments')
        .select('id')
        .limit(1);

      if (tableError) {
        showToast.danger(`Comments table error:${tableError}`);
        if (tableError.message && tableError.message.includes('relation "comments" does not exist')) {
          showToast.danger('Comments table does not exist. Run: npm run setup:missing-tables');
          setComments([]);
          return;
        }
        throw tableError;
      }

      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back, {user?.email}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardBody className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <ExclamationTriangleIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {todos.filter(t => t.status === 'todo').length}
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
              {todos.filter(t => t.status === 'in-progress').length}
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
              {todos.filter(t => t.status === 'done').length}
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
              {todos.filter(t => t.priority === 'urgent').length}
            </div>
            <div className="text-sm text-gray-600">High Priority</div>
          </CardBody>
        </Card>
      </div>

      {/* Two Zones Layout - 50:50 Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Todo List Zone */}
        <div>
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-blue-500" />
                <h2 className="text-xl font-semibold">Todo List ({todos.length})</h2>
              </div>
              <Button 
                color="primary" 
                startContent={<PlusIcon className="w-4 h-4" />}
                onPress={handleAddTodo}
              >
                Add Todo
              </Button>
            </CardHeader>
            <CardBody>
              {todosLoading ? (
                <div className="text-center py-8">Loading todos...</div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {todos
                    .sort((a, b) => {
                      // First sort by priority (urgent > high > medium > low)
                      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
                      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
                      if (priorityDiff !== 0) return priorityDiff;
                      
                      // Then sort by due date (earliest first, null dates last)
                      if (!a.due_date && !b.due_date) return 0;
                      if (!a.due_date) return 1;
                      if (!b.due_date) return -1;
                      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                    })
                    .map((todo) => (
                    <Card key={todo.id} className="hover:shadow-md transition-shadow">
                      <CardBody>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1" title={`Priority: ${getPriorityLabel(todo.priority)}`}>
                            {getPriorityIcon(todo.priority)}
                            <span className="text-xs text-gray-500">{getPriorityLabel(todo.priority)}</span>
                          </div>
                          <div className="flex items-center gap-1" title={`Status: ${getStatusLabel(todo.status)}`}>
                            {getStatusIcon(todo.status)}
                            <span className="text-xs text-gray-500">{getStatusLabel(todo.status)}</span>
                          </div>
                          <div className="flex items-center gap-1" title={`Category: ${getCategoryLabel(todo.category)}`}>
                            {getCategoryIcon(todo.category)}
                            <span className="text-xs text-gray-500">{getCategoryLabel(todo.category)}</span>
                          </div>
                        </div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                              {todo.title}
                            </h3>
                            {todo.description && (
                              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                                {todo.description}
                              </p>
                            )}
                            <div className="grid gap-4 text-xs text-gray-500 mt-3 grid-cols-1 md:grid-cols-12">
                              {todo.due_date && (
                                <div className="md:col-span-3 min-w-0">
                                  <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</div>
                                  <div className="truncate">{todo.due_date}</div>
                                </div>
                              )}
                              <div className={`min-w-0 ${todo.due_date ? 'md:col-span-6' : 'md:col-span-8'}`}>
                                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Created by</div>
                                <div className="truncate">{todo.user_email}</div>
                              </div>
                              <div className={`min-w-0 ${todo.due_date ? 'md:col-span-3' : 'md:col-span-4'}`}>
                                <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Created</div>
                                <div className="truncate">{new Date(todo.created_at).toLocaleDateString('en-CA', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                })}</div>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="light"
                              color="primary"
                              isIconOnly
                              onPress={() => handleEditTodo(todo)}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="light"
                              color="success"
                              isIconOnly
                              onPress={() => updateTodoStatus(todo.id, 'done')}
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="light"
                              color="danger"
                              isIconOnly
                              onPress={() => deleteTodo(todo.id)}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                  {todos.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No todos found. Create your first todo!
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Comments Zone */}
        <div>
          <Card>
            <CardHeader className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-purple-500" />
                <h2 className="text-xl font-semibold">Comments ({comments.length})</h2>
              </div>
              <Button 
                color="primary" 
                startContent={<PlusIcon className="w-4 h-4" />}
                onPress={onAddCommentOpen}
              >
                Add Comment
              </Button>
            </CardHeader>
            <CardBody>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {comments.map((comment) => (
                  <Card key={comment.id} className="hover:shadow-md transition-shadow">
                    <CardBody>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex items-center gap-1" title={`Type: ${getCommentTypeLabel(comment.type)}`}>
                              {getCommentTypeIcon(comment.type)}
                              <span className="text-xs text-gray-500">{getCommentTypeLabel(comment.type)}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {comment.content}
                          </p>
                          <div className="grid gap-4 text-xs text-gray-500 mt-3 grid-cols-1 md:grid-cols-12">
                            <div className="md:col-span-6 min-w-0">
                              <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Created by</div>
                              <div className="truncate">{comment.user_email}</div>
                            </div>
                            <div className="md:col-span-6 min-w-0">
                              <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Created</div>
                              <div className="truncate">{new Date(comment.created_at).toLocaleDateString('en-CA', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                              })}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="light"
                            color="primary"
                            isIconOnly
                            onPress={() => handleEditComment(comment)}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            isIconOnly
                            onPress={() => deleteComment(comment.id)}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
                {comments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No comments yet. Add your first comment!
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Release Notes Tab */}
      <Card>
        <CardHeader className="flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5 text-green-500" />
          <h2 className="text-xl font-semibold">Release Notes ({releaseNotes.length})</h2>
        </CardHeader>
        <CardBody>
          {releaseNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No release notes found.</p>
              <p className="text-sm mt-2">Check the console for debugging information.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {releaseNotes.map((release, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          Version {release.version}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {release.date}
                        </p>
                      </div>
                      {index === 0 && (
                        <Chip color='success' variant="shadow" size='sm' className="mx-3">
                          Current Version
                        </Chip>
                      )}
                    </div>
                  </CardHeader>
                  <CardBody>
                    <div className="space-y-4">
                      {release.features.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                            🚀 New Features
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            {release.features.map((feature, idx) => (
                              <li key={idx}>{feature}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {release.improvements.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                            🔧 Improvements
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            {release.improvements.map((improvement, idx) => (
                              <li key={idx}>{improvement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {release.bugFixes.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                            🐛 Bug Fixes
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            {release.bugFixes.map((bugFix, idx) => (
                              <li key={idx}>{bugFix}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {release.technical.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                            📋 Technical Updates
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            {release.technical.map((update, idx) => (
                              <li key={idx}>{update}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

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
                onChange={(e) => setTodoFormData({ ...todoFormData, title: e.target.value })}
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
                  onChange={(e) => setTodoFormData({ ...todoFormData, description: e.target.value })}
                  placeholder="Enter description (optional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={todoFormData.priority}
                  onChange={(e) => setTodoFormData({ ...todoFormData, priority: e.target.value as TodoItem['priority'] })}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={todoFormData.category}
                  onChange={(e) => setTodoFormData({ ...todoFormData, category: e.target.value as TodoItem['category'] })}
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
                onChange={(e) => setTodoFormData({ ...todoFormData, due_date: e.target.value })}
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
                onChange={(e) => setTodoFormData({ ...todoFormData, title: e.target.value })}
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
                  onChange={(e) => setTodoFormData({ ...todoFormData, description: e.target.value })}
                  placeholder="Enter description (optional)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={todoFormData.priority}
                  onChange={(e) => setTodoFormData({ ...todoFormData, priority: e.target.value as TodoItem['priority'] })}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={todoFormData.status}
                  onChange={(e) => setTodoFormData({ ...todoFormData, status: e.target.value as TodoItem['status'] })}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                value={todoFormData.category}
                onChange={(e) => setTodoFormData({ ...todoFormData, category: e.target.value as TodoItem['category'] })}
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
                onChange={(e) => setTodoFormData({ ...todoFormData, due_date: e.target.value })}
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
                  onChange={(e) => setCommentFormData({ ...commentFormData, type: e.target.value as Comment['type'] })}
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
                onChange={(e) => setCommentFormData({ ...commentFormData, content: e.target.value })}
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
                  <strong>Created:</strong> {selectedComment?.created_at ? new Date(selectedComment.created_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comment Type
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-600"
                  value={editCommentFormData.type}
                  onChange={(e) => setEditCommentFormData({ ...editCommentFormData, type: e.target.value as Comment['type'] })}
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
                onChange={(e) => setEditCommentFormData({ ...editCommentFormData, content: e.target.value })}
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