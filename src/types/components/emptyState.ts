export type EmptyStateType =
  | 'posts'
  | 'users'
  | 'matches'
  | 'photos'
  | 'categories'
  | 'settings'
  | 'todos'
  | 'committees'
  | 'birthdays'
  | 'trainingSession'
  | 'comments';

export interface EmptyStateProps {
  title: string;
  description: string;
  type?: EmptyStateType;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}
