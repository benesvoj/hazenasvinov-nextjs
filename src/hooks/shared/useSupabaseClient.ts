import {useMemo} from 'react';

import {createClient} from '@/utils/supabase/client';

export function useSupabaseClient() {
  return useMemo(() => createClient(), []);
}
