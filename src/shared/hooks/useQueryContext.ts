'use client';

import {useMemo} from 'react';

import {useAuth} from '@/hooks/auth/useAuthNew';
import {useSupabaseClient} from '@/hooks/shared/useSupabaseClient';

import type {QueryContext} from '@/queries/shared/types';

export function useQueryContext(): QueryContext {
  const supabase = useSupabaseClient();
  const {user} = useAuth();

  return useMemo(
    () => ({
      supabase,
      userId: user?.id,
    }),
    [supabase, user]
  );
}
