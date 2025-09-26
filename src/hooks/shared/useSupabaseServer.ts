import {useMemo} from 'react';
import {createClient} from '@/utils/supabase/server';

export function useSupabaseServer() {
  return useMemo(() => createClient(), []);
}
