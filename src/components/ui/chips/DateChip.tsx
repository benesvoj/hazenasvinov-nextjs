'use client';

import {CalendarIcon} from '@heroicons/react/24/outline';

import {formatDateString} from '@/helpers';

interface DateChipProps {
  date: string | null;
  showIcon?: boolean;
  className?: string;
}

/**
 * Reusable date chip component
 * Use for displaying formatted dates across the app
 */
export function DateChip({date, showIcon = true, className = ''}: DateChipProps) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {showIcon && <CalendarIcon className="w-4 h-4" />}
      <span>{date ? formatDateString(date) : '-'}</span>
    </div>
  );
}
