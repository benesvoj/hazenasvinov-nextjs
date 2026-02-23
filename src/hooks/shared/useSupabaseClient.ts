import {useMemo} from 'react';

import {supabaseBrowserClient} from '@/utils/supabase/client';

/**
 * Hook to get a memoized Supabase browser client.
 *
 * This is the **standard pattern** for accessing Supabase in client-side code.
 * Use in client components, custom hooks, and context providers.
 *
 * @returns Memoized Supabase client instance
 *
 * @example
 * // In a component
 * const supabase = useSupabaseClient();
 * const { data } = await supabase.from('posts').select();
 *
 * @example
 * // In a custom hook
 * export function usePosts() {
 *   const supabase = useSupabaseClient();
 *   // ...
 * }
 *
 * @see /src/utils/supabase/docs/SUPABASE_CLIENTS_GUIDE.md
 */
export function useSupabaseClient() {
  return useMemo(() => supabaseBrowserClient(), []);
}
