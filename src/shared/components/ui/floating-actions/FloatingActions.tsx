'use client';

import {ReactNode, useEffect, useState} from 'react';

import {PlusIcon, XMarkIcon} from '@/lib/icons';

import {cn} from '@/shared/lib/cn';

interface Action {
  label: string;
  icon: ReactNode;
  onClick: () => void;
}

interface Props {
  actions: Action[];
}

export function FloatingActions({actions}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={cn(
          'fixed inset-0 z-40 transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
          'bg-black/30 backdrop-blur-[2px]'
        )}
        aria-hidden
      />

      <div
        className="
          fixed z-50 flex flex-col items-end gap-3
          right-6
          bottom-[calc(1.5rem+env(safe-area-inset-bottom))]
        "
      >
        {actions.map((action, index) => (
          <div
            key={index}
            className={cn(
              'transition-all duration-200 transform',
              open
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-4 scale-95 pointer-events-none'
            )}
            style={{
              transitionDelay: open ? `${index * 50}ms` : '0ms',
            }}
          >
            <button
              onClick={() => {
                action.onClick();
                setOpen(false);
              }}
              className={cn(
                'flex items-center gap-2',
                'px-4 py-2 rounded-full',
                'bg-white text-gray-800',
                'shadow-lg hover:shadow-xl',
                'hover:bg-gray-100 active:bg-gray-200',
                'transition',
                'min-h-[44px]',
                'cursor-pointer'
              )}
            >
              {action.icon}
              <span className="text-sm">{action.label}</span>
            </button>
          </div>
        ))}

        <div className="relative group">
          {!open && (
            <div
              className={cn(
                'absolute right-full mr-3 top-1/2 -translate-y-1/2',
                'px-2 py-1 text-xs rounded bg-black text-white',
                'opacity-0 group-hover:opacity-100',
                'transition pointer-events-none whitespace-nowrap'
              )}
            >
              Akce
            </div>
          )}

          <button
            aria-label="Otevřít akce"
            aria-expanded={open}
            onClick={() => setOpen((p) => !p)}
            style={{backgroundColor: 'var(--color-primary)'}}
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center',
              'cursor-pointer',
              'shadow-xl hover:shadow-2xl',
              'transition-all duration-200',
              'bg-[var(--color-primary)]',
              'text-white ',
              'hover:bg-[var(--color-primary-hover)]',
              'active:bg-[var(--color-primary-active)]',
              'active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-white/50',
              open && 'rotate-90 scale-110'
            )}
          >
            {open ? (
              <XMarkIcon className="w-7 h-7 drop-shadow-sm" />
            ) : (
              <PlusIcon className="w-7 h-7 drop-shadow-sm" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
