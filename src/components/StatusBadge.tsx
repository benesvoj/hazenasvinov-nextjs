import { Badge } from "@heroui/badge";

interface StatusBadgeProps {
  status: string;
  variant?: "solid" | "flat" | "faded" | "shadow";
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Status mapping for consistent colors and labels
const getStatusConfig = (status: string) => {
  const statusMap: Record<string, { 
    label: string; 
    color: "default" | "primary" | "secondary" | "success" | "warning" | "danger";
    variant?: "solid" | "flat" | "faded" | "shadow";
  }> = {
    // Blog post statuses
    'draft': { label: 'Koncept', color: 'warning', variant: 'flat' },
    'published': { label: 'Publikováno', color: 'success', variant: 'flat' },
    'archived': { label: 'Archivováno', color: 'secondary', variant: 'flat' },
    
    // Match statuses
    'scheduled': { label: 'Naplánováno', color: 'primary', variant: 'flat' },
    'in_progress': { label: 'Probíhá', color: 'warning', variant: 'flat' },
    'completed': { label: 'Dokončeno', color: 'success', variant: 'flat' },
    'cancelled': { label: 'Zrušeno', color: 'danger', variant: 'flat' },
    'postponed': { label: 'Odloženo', color: 'secondary', variant: 'flat' },
    
    // User statuses
    'active': { label: 'Aktivní', color: 'success', variant: 'flat' },
    'inactive': { label: 'Neaktivní', color: 'secondary', variant: 'flat' },
    'suspended': { label: 'Pozastaveno', color: 'danger', variant: 'flat' },
    
    // Member function statuses
    'current': { label: 'Aktuální', color: 'success', variant: 'flat' },
    'past': { label: 'Minulá', color: 'secondary', variant: 'flat' },
    'future': { label: 'Budoucí', color: 'primary', variant: 'flat' },
    
    // Default
    'default': { label: status, color: 'default', variant: 'flat' }
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
