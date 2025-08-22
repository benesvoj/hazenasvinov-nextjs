import { Button } from "@heroui/button";
import { 
  DocumentTextIcon, 
  UserGroupIcon, 
  CalendarIcon, 
  PhotoIcon,
  TrophyIcon,
  CogIcon
} from "@heroicons/react/24/outline";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "outline";
  };
  className?: string;
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
    default:
      return <DocumentTextIcon className="w-12 h-12" />;
  }
};

export default function EmptyState({ 
  title, 
  description, 
  icon,
  action,
  className = "",
  type
}: EmptyStateProps & { type?: string }) {
  const defaultIcon = getDefaultIcon(type);
  
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-gray-100 dark:bg-gray-800 mb-6">
        {icon || defaultIcon}
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      
      <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
        {description}
      </p>
      
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || "primary"}
          color="primary"
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Specific empty state components
export function EmptyPostsState({ 
  onCreatePost,
  className = ""
}: { 
  onCreatePost: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      type="posts"
      title="Žádné články"
      description="Zatím nebyly vytvořeny žádné články. Vytvořte první článek pro váš klub."
      action={{
        label: "Vytvořit článek",
        onClick: onCreatePost
      }}
      className={className}
    />
  );
}

export function EmptyMatchesState({ 
  onCreateMatch,
  className = ""
}: { 
  onCreateMatch: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      type="matches"
      title="Žádné zápasy"
      description="Zatím nebyly naplánovány žádné zápasy. Přidejte první zápas do kalendáře."
      action={{
        label: "Přidat zápas",
        onClick: onCreateMatch
      }}
      className={className}
    />
  );
}

export function EmptyMembersState({ 
  onAddMember,
  className = ""
}: { 
  onAddMember: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      type="users"
      title="Žádní členové"
      description="Zatím nebyli přidáni žádní členové klubu. Přidejte první členy."
      action={{
        label: "Přidat člena",
        onClick: onAddMember
      }}
      className={className}
    />
  );
}
