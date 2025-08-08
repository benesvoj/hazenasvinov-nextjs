export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in-progress' | 'done';
  category: 'feature' | 'bug' | 'improvement' | 'technical';
  due_date?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  user_email: string;
}

export const getPriorityColor = (priority: TodoItem['priority']) => {
  switch (priority) {
    case 'urgent': return 'danger';
    case 'high': return 'warning';
    case 'medium': return 'primary';
    case 'low': return 'default';
    default: return 'default';
  }
};

export const getStatusColor = (status: TodoItem['status']) => {
  switch (status) {
    case 'done': return 'success';
    case 'in-progress': return 'primary';
    case 'todo': return 'default';
    default: return 'default';
  }
};

export const getCategoryColor = (category: TodoItem['category']) => {
  switch (category) {
    case 'feature': return 'success';
    case 'bug': return 'danger';
    case 'improvement': return 'primary';
    case 'technical': return 'secondary';
    default: return 'default';
  }
};

export const getPriorityLabel = (priority: TodoItem['priority']) => {
  switch (priority) {
    case 'urgent': return 'Urgent';
    case 'high': return 'High';
    case 'medium': return 'Medium';
    case 'low': return 'Low';
    default: return 'Unknown';
  }
};

export const getStatusLabel = (status: TodoItem['status']) => {
  switch (status) {
    case 'done': return 'Done';
    case 'in-progress': return 'In Progress';
    case 'todo': return 'To Do';
    default: return 'Unknown';
  }
};

export const getCategoryLabel = (category: TodoItem['category']) => {
  switch (category) {
    case 'feature': return 'Feature';
    case 'bug': return 'Bug';
    case 'improvement': return 'Improvement';
    case 'technical': return 'Technical';
    default: return 'Unknown';
  }
};
