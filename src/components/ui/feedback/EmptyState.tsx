import {Button} from '@heroui/button';

import {
  DocumentTextIcon,
  UserGroupIcon,
  CalendarIcon,
  PhotoIcon,
  TrophyIcon,
  CogIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

import {EmptyStateTypes} from '@/enums/emptyStateTypes';

import {Heading} from '../heading/Heading';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'ghost';
  };
  className?: string;
  type?: EmptyStateTypes;
}

// Icon mapping for common empty states
const getDefaultIcon = (type?: string) => {
  switch (type) {
    case 'posts':
      return <DocumentTextIcon className="w-12 h-12" />;
    case 'users':
      return <UserGroupIcon className="w-12 h-12" />;
    case 'matches':
      return <CalendarIcon className="w-12 h-12" />;
    case 'photos':
      return <PhotoIcon className="w-12 h-12" />;
    case 'categories':
      return <TrophyIcon className="w-12 h-12" />;
    case 'settings':
      return <CogIcon className="w-12 h-12" />;
    case 'todos':
      return <CheckCircleIcon className="w-12 h-12" />;
    default:
      return <DocumentTextIcon className="w-12 h-12" />;
  }
};

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className = '',
  type,
}: EmptyStateProps & {type?: string}) {
  const defaultIcon = getDefaultIcon(type);

  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
        {icon || defaultIcon}
      </div>

      <Heading size={3}>{title}</Heading>

      <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">{description}</p>

      {action && (
        <Button onPress={action.onClick} variant={action.variant || 'solid'} color="primary">
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Specific empty state components
export function EmptyPostsState({
  onCreate,
  className = '',
}: {
  onCreate: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      type={EmptyStateTypes.POSTS}
      title="Žádné články"
      description="Zatím nebyly vytvořeny žádné články. Vytvořte první článek pro váš klub."
      action={{
        label: 'Vytvořit článek',
        onClick: onCreate,
      }}
      className={className}
    />
  );
}

export function EmptyMatchesState({
  onCreate,
  className = '',
}: {
  onCreate: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      type={EmptyStateTypes.MATCHES}
      title="Žádné zápasy"
      description="Zatím nebyly naplánovány žádné zápasy. Přidejte první zápas do kalendáře."
      action={{
        label: 'Přidat zápas',
        onClick: onCreate,
      }}
      className={className}
    />
  );
}

export function EmptyMembersState({
  onCreate,
  className = '',
}: {
  onCreate: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      type={EmptyStateTypes.USERS}
      title="Žádní členové"
      description="Zatím nebyli přidáni žádní členové klubu. Přidejte první členy."
      action={{
        label: 'Přidat člena',
        onClick: onCreate,
      }}
      className={className}
    />
  );
}

export function EmptyTodosState({
  onCreate,
  className = '',
}: {
  onCreate: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      type={EmptyStateTypes.TODOS}
      title="Žádné úkoly"
      description="Zatím nebyly vytvořeny žádné úkoly. Vytvořte první úkol."
      action={{
        label: 'Vytvořit úkol',
        onClick: onCreate,
      }}
      className={className}
    />
  );
}

export const renderEmptyState = (emptyStateType: EmptyStateTypes, onCreate: () => void) => {
  if (!emptyStateType) return null;

  switch (emptyStateType) {
    case EmptyStateTypes.TODOS:
      return <EmptyTodosState onCreate={onCreate || (() => {})} />;
    case EmptyStateTypes.POSTS:
      return <EmptyPostsState onCreate={onCreate || (() => {})} />;
    case EmptyStateTypes.MATCHES:
      return <EmptyMatchesState onCreate={onCreate || (() => {})} />;
    case EmptyStateTypes.USERS:
      return <EmptyMembersState onCreate={onCreate || (() => {})} />;
    default:
      return (
        <EmptyState type={emptyStateType} title={'No data'} description={'No items to display'} />
      );
  }
};
