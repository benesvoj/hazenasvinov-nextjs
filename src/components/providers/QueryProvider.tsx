'use client';

import {ReactNode, useMemo} from 'react';

import {QueryClientProvider} from '@tanstack/react-query';
import {ReactQueryDevtools} from '@tanstack/react-query-devtools';

import {getQueryClient} from '@/lib/getQueryClient';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({children}: QueryProviderProps) {
  const queryClient = useMemo(() => getQueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
