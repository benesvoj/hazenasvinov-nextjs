import { Badge } from "@heroui/badge";

interface StatusBadgeProps {
  status: string;
  variant?: "solid" | "bordered" | "light" | "flat" | "faded" | "shadow";
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Status mapping for consistent colors and labels
const getStatusConfig = (status: string) => {
  const statusMap: Record<string, { 
    label: string; 
    color: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
    variant?: "solid" | "bordered" | "light" | "flat" | "faded" | "shadow";
  }> = {
    // Blog post statuses
    'draft': { label: 'Koncept', color: 'warning', variant: 'light' },
    'published': { label: 'Publikováno', color: 'success', variant: 'light' },
    'archived': { label: 'Archivováno', color: 'secondary', variant: 'light' },
    
    // Match statuses
    'scheduled': { label: 'Naplánováno', color: 'primary', variant: 'light' },
    'in_progress': { label: 'Probíhá', color: 'warning', variant: 'light' },
    'completed': { label: 'Dokončeno', color: 'success', variant: 'light' },
    'cancelled': { label: 'Zrušeno', color: 'danger', variant: 'light' },
    'postponed': { label: 'Odloženo', color: 'secondary', variant: 'light' },
    
    // User statuses
    'active': { label: 'Aktivní', color: 'success', variant: 'light' },
    'inactive': { label: 'Neaktivní', color: 'secondary', variant: 'light' },
    'suspended': { label: 'Pozastaveno', color: 'danger', variant: 'light' },
    
    // Member function statuses
    'current': { label: 'Aktuální', color: 'success', variant: 'light' },
    'past': { label: 'Minulá', color: 'secondary', variant: 'light' },
    'future': { label: 'Budoucí', color: 'primary', variant: 'light' },
    
    // Default
    'default': { label: status, color: 'default', variant: 'light' }
  };
  
  return statusMap[status.toLowerCase()] || statusMap['default'];
};

export default function StatusBadge({ 
  status, 
  variant,
  size = "sm",
  className = ""
}: StatusBadgeProps) {
  const config = getStatusConfig(status);
  
  return (
    <Badge
      color={config.color}
      variant={variant || config.variant}
      size={size}
      className={className}
    >
      {config.label}
    </Badge>
  );
}

// Specific status badge components
export function PostStatusBadge({ 
  status, 
  className = "" 
}: { 
  status: string;
  className?: string;
}) {
  return (
    <StatusBadge 
      status={status} 
      className={className}
    />
  );
}

export function MatchStatusBadge({ 
  status, 
  className = "" 
}: { 
  status: string;
  className?: string;
}) {
  return (
    <StatusBadge 
      status={status} 
      className={className}
    />
  );
}

export function UserStatusBadge({ 
  status, 
  className = "" 
}: { 
  status: string;
  className?: string;
}) {
  return (
    <StatusBadge 
      status={status} 
      className={className}
    />
  );
}

export function MemberFunctionStatusBadge({ 
  status, 
  className = "" 
}: { 
  status: string;
  className?: string;
}) {
  return (
    <StatusBadge 
      status={status} 
      className={className}
    />
  );
}
