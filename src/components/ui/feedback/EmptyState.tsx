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

import {Heading} from '@/components';
import {EmptyStateTypes} from '@/enums';
import {EmptyStateProps} from '@/types';

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
    case 'committees':
      return <UserGroupIcon className="w-12 h-12" />;
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
    <div
      className={` flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}
    >
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

// Generic empty state configuration
const EMPTY_STATE_CONFIG = {
  [EmptyStateTypes.TODOS]: {
    title: 'Žádné úkoly',
    description: 'Zatím nebyly vytvořeny žádné úkoly. Vytvořte první úkol.',
    actionLabel: 'Vytvořit úkol',
  },
  [EmptyStateTypes.POSTS]: {
    title: 'Žádné články',
    description: 'Zatím nebyly vytvořeny žádné články. Vytvořte první článek pro váš klub.',
    actionLabel: 'Vytvořit článek',
  },
  [EmptyStateTypes.MATCHES]: {
    title: 'Žádné zápasy',
    description: 'Zatím nebyly naplánovány žádné zápasy. Přidejte první zápas do kalendáře.',
    actionLabel: 'Přidat zápas',
  },
  [EmptyStateTypes.USERS]: {
    title: 'Žádní členové',
    description: 'Zatím nebyli přidáni žádní členové klubu. Přidejte první členy.',
    actionLabel: 'Přidat člena',
  },
  [EmptyStateTypes.PHOTOS]: {
    title: 'Žádné fotky',
    description: 'Zatím nebyly nahrány žádné fotky. Nahrajte první fotky.',
    actionLabel: 'Nahrát fotky',
  },
  [EmptyStateTypes.CATEGORIES]: {
    title: 'Žádné kategorie',
    description: 'Zatím nebyly vytvořeny žádné kategorie. Vytvořte první kategorii.',
    actionLabel: 'Vytvořit kategorii',
  },
  [EmptyStateTypes.SETTINGS]: {
    title: 'Žádná nastavení',
    description: 'Zatím nejsou k dispozici žádná nastavení.',
    actionLabel: 'Konfigurovat',
  },
  [EmptyStateTypes.COMMITTEES]: {
    title: 'Žádné komise',
    description: 'Zatím nebyly vytvořeny žádné komise. Vytvořte první komisi.',
    actionLabel: 'Vytvořit komisi',
  },
};

// Generic empty state component
export function GenericEmptyState({
  emptyStateType,
  onCreate,
  className = '',
}: {
  emptyStateType: EmptyStateTypes;
  onCreate: () => void;
  className?: string;
}) {
  const config = EMPTY_STATE_CONFIG[emptyStateType];

  if (!config) {
    return (
      <EmptyState
        type={emptyStateType}
        title="No data"
        description="No items to display"
        className={className}
      />
    );
  }

  return (
    <EmptyState
      type={emptyStateType}
      title={config.title}
      description={config.description}
      action={{
        label: config.actionLabel,
        onClick: onCreate,
      }}
      className={className}
    />
  );
}

export const renderEmptyState = (emptyStateType: EmptyStateTypes, onCreate: () => void) => {
  if (!emptyStateType) return null;

  return <GenericEmptyState emptyStateType={emptyStateType} onCreate={onCreate} />;
};
