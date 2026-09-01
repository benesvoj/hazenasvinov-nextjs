import {cookies} from 'next/headers';

import {createServerClient} from '@supabase/ssr';

import type {Database} from '@/types/database/supabase';

/**
 * Creates a Supabase server client for use in Server Components and API routes
 *
 * @description For API routes, prefer using helper utilities from '@/utils/supabase/apiHelpers'
 * which provide built-in authentication and error handling.
 *
 * @example
 * // ❌ Old way (deprecated for API routes)
 * const supabase = await createClient();
 * const { data: { user } } = await supabase.auth.getUser();
 * if (!user) return NextResponse.json({error: 'Unauthorized'}, {status: 401});
 *
 * // ✅ New way (use apiHelpers for API routes)
 * import { withAuth } from '@/utils/supabase/apiHelpers';
 * export async function GET() {
 *   return withAuth(async (user, supabase) => {
 *     // user is already authenticated
 *     const { data } = await supabase.from('table').select();
 *     return NextResponse.json({ data });
 *   });
 * }
 *
 * @returns Supabase client with cookie-based authentication
 *
 * @description Shaped to match `getSupabaseServer` from `@services/sb-hs`. The cookie
 * name and domain are intentionally left at the Supabase defaults here — the monorepo
 * sets `sb-hazenasvinov-auth-token` on `.hazenasvinov.test`/`.hazenasvinov.cz`, which
 * is what makes login work across subdomains, but applying it in this repo would
 * invalidate every current session.
 */
export async function supabaseServerClient() {
  const cookieStore = await cookies();

  // The monorepo reads NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY; this repo has always used
  // NEXT_PUBLIC_SUPABASE_ANON_KEY. Reading both keeps one env file working either side
  // of the move.
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({name, value, options}) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}

/** Alias under the monorepo's name, so call sites can migrate ahead of the move. */
export const getSupabaseServer = supabaseServerClient;
