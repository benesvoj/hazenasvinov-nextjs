import {Spinner} from '@heroui/spinner';

import {translations} from '@/lib/translations';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  className?: string;
  label?: string;
}

export default function LoadingSpinner({
  size = 'md',
  color = 'primary',
  className = '',
  label = translations.loading,
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <Spinner size={size} color={color} />
      {label && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{label}</p>}
    </div>
  );
}

// Full page loading spinner
export function FullPageSpinner({
  label = 'Načítání stránky...',
  className = '',
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${className}`}>
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}

// Inline loading spinner
export function InlineSpinner({
  size = 'sm',
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <LoadingSpinner size={size} />
    </div>
  );
}
